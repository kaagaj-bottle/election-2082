"""
Fetch live FPTP election results from the Election Commission website.

Uses the official JSON data at result.election.gov.np with multi-URL fallback.
Only updates votes_received and status — never touches candidate identity fields.
"""

import json
import logging
import os
import re
import time
import urllib.request
from dataclasses import dataclass
from typing import Any

from curl_cffi.requests import Session
from django.db import transaction

from app.apps.candidates.models import Candidate, ElectionType, ResultFetchLog
from app.apps.elections.models import Election

logger = logging.getLogger(__name__)

BASE_URL = "https://result.election.gov.np"

_URL_PATHS = [
    "/Handlers/SecureJson.ashx?file=JSONFiles/ElectionResultCentral2082.txt",
    "/Handlers/SecureJson.ashx?file=JSONFiles/Election2082/ElectionResultCentral2082.txt",
]

# Pages to try for session establishment (in order)
_SESSION_PAGES = [
    "/",
    "/MapElectionResult2082.aspx",
]

# Minimum number of records expected — safety check against partial/corrupt data
MIN_EXPECTED_RECORDS = 100


@dataclass
class FetchResult:
    success: bool
    records_fetched: int = 0
    candidates_updated: int = 0
    error_message: str = ""
    duration_seconds: float = 0


def _build_session() -> Session:  # type: ignore[type-arg]
    """Create a curl_cffi session with Chrome TLS impersonation."""
    return Session(impersonate="chrome")


def _establish_session(session: Session) -> str | None:  # type: ignore[type-arg]
    """Try session pages to establish cookies and extract CSRF token."""
    html = ""
    for page in _SESSION_PAGES:
        url = BASE_URL + page
        try:
            resp = session.get(url, timeout=30)
            if resp.status_code == 200:
                html = resp.text
                logger.debug("Session established via %s", page)
                break
            logger.warning("Session page %s failed: HTTP %d", page, resp.status_code)
        except Exception:
            logger.warning("Session page %s failed", page, exc_info=True)

    if not html:
        logger.warning("All session pages failed — proceeding without session")
        return None

    # Try extracting token from CsrfToken cookie
    val = session.cookies.get("CsrfToken")
    if val:
        logger.debug("Found CSRF token in CsrfToken cookie")
        return val

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

    # Last resort: fetch Common.js
    try:
        resp = session.get(BASE_URL + "/JSLibrary/Common.js", timeout=30)
        js_text = resp.text
        for pattern in patterns:
            match = re.search(pattern, js_text, re.IGNORECASE)
            if match:
                logger.debug("Found CSRF token in Common.js")
                return match.group(1)
    except Exception:
        logger.warning("Could not fetch Common.js", exc_info=True)

    logger.debug("No CSRF token found — proceeding without one")
    return None


def _fetch_json_data() -> list[dict[str, Any]]:
    """Try each URL strategy with curl_cffi session until one succeeds."""
    session = _build_session()
    csrf_token = _establish_session(session)

    headers = {
        "Referer": BASE_URL + "/",
        "Origin": BASE_URL,
        "Accept": "application/json, text/plain, */*",
        "X-Requested-With": "XMLHttpRequest",
    }
    if csrf_token:
        headers["X-CSRF-Token"] = csrf_token
        headers["__RequestVerificationToken"] = csrf_token

    last_error: Exception | None = None

    for url_path in _URL_PATHS:
        url = f"{BASE_URL}{url_path}"
        try:
            resp = session.get(url, headers=headers, timeout=180)
            resp.raise_for_status()
            raw = resp.content.decode("utf-8-sig")

            data = json.loads(raw)
            if isinstance(data, dict) and "data" in data:
                data = data["data"]
            if not isinstance(data, list):
                raise ValueError(f"Expected list, got {type(data).__name__}")

            logger.info("Successfully fetched %d records from %s", len(data), url_path)
            return data

        except Exception as e:
            last_error = e
            logger.warning("URL %s failed: %s: %s", url_path, type(e).__name__, e)

    raise RuntimeError(f"All URL strategies failed. Last error: {last_error}")


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
        status = str(row.get("Remarks") or "").strip()
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


def _notify_discord(result: FetchResult) -> None:
    """Send a Discord webhook notification after a successful fetch."""
    webhook_url = os.environ.get(
        "DISCORD_WEBHOOK_URL",
    )
    if not webhook_url:
        return
    try:
        msg = (
            f"**Election Results Updated**\n"
            f"Records fetched: {result.records_fetched}\n"
            f"Candidates updated: {result.candidates_updated}\n"
            f"Duration: {result.duration_seconds:.1f}s"
        )
        payload = json.dumps({"content": msg}).encode("utf-8")
        req = urllib.request.Request(
            webhook_url,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "Election2082-Bot",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10):
            pass
        logger.info("Discord notification sent")
    except Exception:
        logger.warning("Discord notification failed", exc_info=True)


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
        _notify_discord(result)
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
