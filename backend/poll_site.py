"""Poll result.election.gov.np until it returns 200, then fetch JSON data files."""

import json
import re
import time
from datetime import datetime
from pathlib import Path

from curl_cffi.requests import Session

BASE_URL = "https://result.election.gov.np"
URL = BASE_URL + "/"
OUTPUT = Path(__file__).parent / "site_response.html"
JSON_DIR = Path(__file__).parent / "json_data"
TIMEOUT = 30

JSON_FILES = [
    "HoRPartyTop5.txt",
    "HOR-T5Winner.json",
    "HOR-T5Leader.json",
    "HOR-T6Winner.json",
    "HOR-T6Leader.json",
]

# Main per-candidate results file — tried under two known paths
CANDIDATE_FILES = [
    "JSONFiles/ElectionResultCentral2082.txt",
    "JSONFiles/Election2082/ElectionResultCentral2082.txt",
]

RESULTS_FILE = Path(__file__).parent / "results_live.json"

# Map JSON filenames to keys in results_live.json
_FILE_KEY_MAP: dict[str, str] = {
    "HoRPartyTop5.txt": "party_summary",
    "HOR-T5Winner.json": "fptp_winners",
    "HOR-T5Leader.json": "fptp_leaders",
    "HOR-T6Winner.json": "independent_winners",
    "HOR-T6Leader.json": "independent_leaders",
}

_CSRF_PATTERNS = [
    r'<meta\s+name=["\']csrf-token["\']\s+content=["\']([^"\']+)["\']',
    r'<input[^>]+name=["\']__RequestVerificationToken["\'][^>]+value=["\']([^"\']+)["\']',
    r"getCsrfToken\(\)\s*\{[^}]*return\s+['\"]([^'\"]+)['\"]",
    r'var\s+csrfToken\s*=\s*["\']([^"\']+)["\']',
]


def _ts() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def _build_session() -> Session:
    """Create a curl_cffi session that impersonates Chrome's TLS fingerprint."""
    return Session(impersonate="chrome")


def _extract_csrf(html: str, session: Session) -> str | None:
    """Extract CSRF token from CsrfToken cookie, HTML, or Common.js."""
    # The server sets a cookie named exactly "CsrfToken"
    val = session.cookies.get("CsrfToken")
    if val:
        print(f"[{_ts()}] Found CSRF token in CsrfToken cookie")
        return val

    # Regex fallback on HTML
    for pattern in _CSRF_PATTERNS:
        match = re.search(pattern, html, re.IGNORECASE)
        if match:
            print(f"[{_ts()}] Found CSRF token via HTML pattern")
            return match.group(1)

    # Last resort: fetch Common.js
    try:
        resp = session.get(BASE_URL + "/JSLibrary/Common.js", timeout=TIMEOUT)
        js_text = resp.text
        for pattern in _CSRF_PATTERNS:
            match = re.search(pattern, js_text, re.IGNORECASE)
            if match:
                print(f"[{_ts()}] Found CSRF token in Common.js")
                return match.group(1)
    except Exception as e:
        print(f"[{_ts()}] Could not fetch Common.js: {e}")

    return None


def _make_headers(csrf_token: str | None) -> dict[str, str]:
    headers: dict[str, str] = {
        "Referer": BASE_URL + "/",
        "Origin": BASE_URL,
        "Accept": "application/json, text/plain, */*",
        "X-Requested-With": "XMLHttpRequest",
    }
    if csrf_token:
        headers["X-CSRF-Token"] = csrf_token
        headers["__RequestVerificationToken"] = csrf_token
    return headers


def _fetch_json_files(
    session: Session, csrf_token: str | None
) -> tuple[int, dict[str, object]]:
    """Fetch JSON data files from SecureJson.ashx. Returns (count saved, parsed data dict)."""
    JSON_DIR.mkdir(parents=True, exist_ok=True)
    headers = _make_headers(csrf_token)
    parsed: dict[str, object] = {}

    saved = 0
    for filename in JSON_FILES:
        url = f"{BASE_URL}/Handlers/SecureJson.ashx?file=JSONFiles/Election2082/Common/{filename}"
        try:
            resp = session.get(url, headers=headers, timeout=60)
            raw = resp.content
            out_path = JSON_DIR / filename
            out_path.write_bytes(raw)
            print(f"[{_ts()}] Saved {filename} ({len(raw)} bytes)")
            saved += 1
            # Parse JSON for results_live.json
            key = _FILE_KEY_MAP.get(filename)
            if key:
                try:
                    parsed[key] = json.loads(raw)
                except (json.JSONDecodeError, ValueError):
                    pass
        except Exception as e:
            print(f"[{_ts()}] Failed to fetch {filename}: {e}")

    # Fetch candidate results file (try multiple known paths)
    for path in CANDIDATE_FILES:
        url = f"{BASE_URL}/Handlers/SecureJson.ashx?file={path}"
        try:
            resp = session.get(url, headers=headers, timeout=60)
            if resp.status_code == 200 and len(resp.content) > 100:
                fname = "ElectionResultCentral2082.txt"
                out_path = JSON_DIR / fname
                out_path.write_bytes(resp.content)
                print(f"[{_ts()}] Saved {fname} ({len(resp.content)} bytes) from {path}")
                saved += 1
                try:
                    parsed["candidates"] = json.loads(resp.content)
                except (json.JSONDecodeError, ValueError):
                    pass
                break
            print(f"[{_ts()}] {path} returned {resp.status_code} ({len(resp.content)} bytes), trying next...")
        except Exception as e:
            print(f"[{_ts()}] Failed to fetch {path}: {e}")

    return saved, parsed


def _write_results(parsed: dict[str, object]) -> None:
    """Write combined results to results_live.json."""
    output = {"fetched_at": datetime.now().isoformat(timespec="seconds"), **parsed}
    RESULTS_FILE.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[{_ts()}] Wrote {RESULTS_FILE.name} ({RESULTS_FILE.stat().st_size} bytes)")


def main() -> None:
    session = _build_session()
    print(f"[{_ts()}] Polling {URL} ...")

    while True:
        try:
            resp = session.get(URL, timeout=TIMEOUT)
            status = resp.status_code
            if status == 200:
                body = resp.content
                OUTPUT.write_bytes(body)
                print(f"[{_ts()}] 200 OK! Saved to {OUTPUT.name} ({len(body)} bytes)")

                # Extract CSRF and fetch JSON files
                html = resp.text
                csrf_token = _extract_csrf(html, session)
                if csrf_token:
                    print(f"[{_ts()}] CSRF token acquired")
                else:
                    print(f"[{_ts()}] No CSRF token found, proceeding without it")

                json_count, parsed = _fetch_json_files(session, csrf_token)
                total_expected = len(JSON_FILES) + 1  # +1 for candidate file
                print(f"[{_ts()}] Fetched {json_count}/{total_expected} JSON files")

                if parsed:
                    _write_results(parsed)

                return
            print(f"[{_ts()}] {status} - retrying...")
        except (OSError, ConnectionError) as e:
            print(f"[{_ts()}] {type(e).__name__}: {e} - retrying...")

        time.sleep(0.5)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n[{_ts()}] Stopped.")
