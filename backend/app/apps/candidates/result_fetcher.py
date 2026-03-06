"""
Fetch live FPTP election results from the Election Commission website.

Uses the official JSON data at result.election.gov.np with multi-URL fallback.
Only updates votes_received and status — never touches candidate identity fields.
"""

import http.cookiejar
import json
import logging
import re
import time
import urllib.request
from dataclasses import dataclass
from typing import Any

from django.db import transaction

from app.apps.candidates.models import Candidate, ElectionType, ResultFetchLog
from app.apps.elections.models import Election

logger = logging.getLogger(__name__)

BASE_URL = "https://result.election.gov.np"

# URL strategies — tried in order (direct first, then CSRF handler)
_URL_PATHS = [
    "/JSONFiles/ElectionResultCentral2082.txt",
    "/JSONFiles/Election2082/ElectionResultCentral2082.txt",
    "/Handlers/SecureJson.ashx?file=JSONFiles/ElectionResultCentral2082.txt",
    "/Handlers/SecureJson.ashx?file=JSONFiles/Election2082/ElectionResultCentral2082.txt",
]

# Pages to try for session establishment (in order)
_SESSION_PAGES = [
    "/",
    "/MapElectionResult2082.aspx",
]

_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)

# Minimum number of records expected — safety check against partial/corrupt data
MIN_EXPECTED_RECORDS = 100

# Retry config
_MAX_RETRIES = 1
_RETRY_DELAY_SECONDS = 5


@dataclass
class FetchResult:
    success: bool
    records_fetched: int = 0
    candidates_updated: int = 0
    error_message: str = ""
    duration_seconds: float = 0


def _build_opener() -> tuple[urllib.request.OpenerDirector, http.cookiejar.CookieJar]:
    """Create a urllib opener that handles cookies automatically."""
    cookie_jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor(cookie_jar)
    )
    return opener, cookie_jar



def _establish_session(
    opener: urllib.request.OpenerDirector,
    cookie_jar: http.cookiejar.CookieJar,
) -> str | None:
    """Try session pages to establish cookies and extract CSRF token."""
    headers = {
        "User-Agent": _USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
    }

    html = ""
    for page in _SESSION_PAGES:
        url = BASE_URL + page
        req = urllib.request.Request(url, headers=headers)
        try:
            with opener.open(req, timeout=30) as resp:
                html = resp.read().decode("utf-8", errors="replace")
            logger.debug("Session established via %s", page)
            break
        except urllib.error.HTTPError as e:
            logger.warning("Session page %s failed: HTTP %d", page, e.code)
        except Exception:
            logger.warning("Session page %s failed", page, exc_info=True)

    if not html:
        logger.warning("All session pages failed — proceeding without session")
        return None

    # Try extracting token from cookies first (ASP.NET anti-forgery)
    for cookie in cookie_jar:
        if "verification" in cookie.name.lower() or "antiforgery" in cookie.name.lower():
            logger.debug("Found CSRF token in cookie: %s", cookie.name)
            return cookie.value

    # Fall back to HTML patterns
    patterns = [
        r'<meta\s+name=["\']csrf-token["\']\s+content=["\']([^"\']+)["\']',
        r'<input[^>]+name=["\']__RequestVerificationToken["\'][^>]+value=["\']([^"\']+)["\']',
        r"getCsrfToken\(\)\s*\{[^}]*return\s+['\"]([^'\"]+)['\"]",
        r'var\s+csrfToken\s*=\s*["\']([^"\']+)["\']',
    ]
    for pattern in patterns:
        match = re.search(pattern, html, re.IGNORECASE)
        if match:
            logger.debug("Found CSRF token via pattern: %s", pattern[:40])
            return match.group(1)

    logger.debug("No CSRF token found — proceeding without one")
    return None


def _fetch_json_data() -> list[dict[str, Any]]:
    """Try each URL strategy with cookie-based session until one succeeds."""
    opener, cookie_jar = _build_opener()
    csrf_token = _establish_session(opener, cookie_jar)

    last_error: Exception | None = None

    for url_path in _URL_PATHS:
        url = f"{BASE_URL}{url_path}"
        headers = {
            "User-Agent": _USER_AGENT,
            "Referer": BASE_URL + "/",
            "Origin": BASE_URL,
            "Accept": "application/json, text/plain, */*",
            "X-Requested-With": "XMLHttpRequest",
            "Sec-Fetch-Site": "same-origin",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Dest": "empty",
        }
        if csrf_token:
            headers["X-CSRF-Token"] = csrf_token
            headers["__RequestVerificationToken"] = csrf_token

        for attempt in range(_MAX_RETRIES + 1):
            try:
                req = urllib.request.Request(url, headers=headers)
                with opener.open(req, timeout=60) as resp:
                    raw = resp.read().decode("utf-8-sig")

                data = json.loads(raw)
                if isinstance(data, dict) and "data" in data:
                    data = data["data"]
                if not isinstance(data, list):
                    raise ValueError(f"Expected list, got {type(data).__name__}")

                logger.info("Successfully fetched %d records from %s", len(data), url_path)
                return data

            except urllib.error.HTTPError as e:
                last_error = e
                body_preview = ""
                if e.code == 403:
                    try:
                        body_preview = e.read().decode("utf-8", errors="replace")[:200]
                    except Exception:
                        body_preview = "(could not read response body)"
                logger.warning(
                    "URL %s failed (attempt %d/%d): HTTP %d%s",
                    url_path, attempt + 1, _MAX_RETRIES + 1, e.code,
                    f" — body: {body_preview}" if body_preview else "",
                )
            except Exception as e:
                last_error = e
                logger.warning(
                    "URL %s failed (attempt %d/%d): %s: %s",
                    url_path, attempt + 1, _MAX_RETRIES + 1,
                    type(e).__name__, e,
                )

            if attempt < _MAX_RETRIES:
                time.sleep(_RETRY_DELAY_SECONDS)

    raise RuntimeError(
        f"All URL strategies failed. Last error: {last_error}"
    )


def _update_candidates(data: list[dict[str, Any]], election: Election) -> int:
    """Update votes_received and status for existing FPTP candidates."""
    # Build a lookup: source_id -> (votes, status)
    updates: dict[int, tuple[int, str]] = {}
    for row in data:
        candidate_id = row.get("CandidateID")
        if candidate_id is None:
            continue
        source_id = int(candidate_id)
        votes = int(row.get("TotalVoteReceived") or 0)
        status = str(row.get("E_STATUS") or "").strip()
        if status in ("0", "-"):
            status = ""
        updates[source_id] = (votes, status)

    # Fetch existing candidates for this election
    candidates = Candidate.objects.filter(
        election=election, election_type=ElectionType.FPTP, source_id__in=updates.keys()
    )

    updated_count = 0
    with transaction.atomic():
        for candidate in candidates:
            votes, status = updates[candidate.source_id]
            changed = False
            if candidate.votes_received != votes:
                candidate.votes_received = votes
                changed = True
            if candidate.status != status:
                candidate.status = status
                changed = True
            if changed:
                candidate.save(update_fields=["votes_received", "status"])
                updated_count += 1

    return updated_count


def fetch_live_results(election_slug: str = "hor-2082") -> FetchResult:
    """
    Main entry point: fetch live results and update candidates.
    Returns a FetchResult with success/failure info.
    Always logs to ResultFetchLog.
    """
    start_time = time.monotonic()
    source_url = f"{BASE_URL}{_URL_PATHS[0]}"

    try:
        election = Election.objects.get(slug=election_slug)
    except Election.DoesNotExist:
        result = FetchResult(
            success=False,
            error_message=f"Election '{election_slug}' not found",
        )
        ResultFetchLog.objects.create(
            success=False,
            source_url=source_url,
            error_message=result.error_message,
            duration_seconds=time.monotonic() - start_time,
        )
        return result

    try:
        data = _fetch_json_data()

        if len(data) < MIN_EXPECTED_RECORDS:
            raise ValueError(
                f"Only {len(data)} records fetched (expected >= {MIN_EXPECTED_RECORDS}). "
                "Aborting to prevent data corruption."
            )

        candidates_updated = _update_candidates(data, election)
        duration = time.monotonic() - start_time

        result = FetchResult(
            success=True,
            records_fetched=len(data),
            candidates_updated=candidates_updated,
            duration_seconds=duration,
        )
        ResultFetchLog.objects.create(
            success=True,
            source_url=source_url,
            records_fetched=len(data),
            candidates_updated=candidates_updated,
            duration_seconds=duration,
        )
        return result

    except Exception as e:
        duration = time.monotonic() - start_time
        error_msg = f"{type(e).__name__}: {e}"
        logger.exception("Failed to fetch live results")

        result = FetchResult(
            success=False,
            error_message=error_msg,
            duration_seconds=duration,
        )
        ResultFetchLog.objects.create(
            success=False,
            source_url=source_url,
            error_message=error_msg,
            duration_seconds=duration,
        )
        return result
