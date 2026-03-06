"""
Fetch live FPTP election results from the Election Commission website.

Uses the official JSON data at result.election.gov.np with multi-URL fallback.
Only updates votes_received and status — never touches candidate identity fields.
"""

import json
import logging
import time
from typing import Any

from django.db import transaction

from app.apps.candidates.fetch_helpers import (
    BASE_URL,
    FetchResult,
    build_session,
    establish_session,
    notify_discord,
)
from app.apps.candidates.models import Candidate, ElectionType, ResultFetchLog
from app.apps.elections.models import Election

logger = logging.getLogger(__name__)

_URL_PATHS = [
    "/Handlers/SecureJson.ashx?file=JSONFiles/ElectionResultCentral2082.txt",
    "/Handlers/SecureJson.ashx?file=JSONFiles/Election2082/ElectionResultCentral2082.txt",
]

# Minimum number of records expected — safety check against partial/corrupt data
MIN_EXPECTED_RECORDS = 100


def _fetch_json_data() -> list[dict[str, Any]]:
    """Try each URL strategy with curl_cffi session until one succeeds."""
    session = build_session()
    csrf_token = establish_session(session)

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
        notify_discord(result, label="FPTP Results")
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
