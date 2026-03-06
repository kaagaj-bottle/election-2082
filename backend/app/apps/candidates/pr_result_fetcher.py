"""
Fetch PR (Proportional Representation) party vote results from the Election Commission.

Updates Party.pr_votes_received with total PR votes per party.
"""

import json
import logging
import time
from typing import Any

from app.apps.candidates.fetch_helpers import (
    BASE_URL,
    FetchResult,
    build_session,
    establish_session,
    notify_discord,
)
from app.apps.candidates.models import ResultFetchLog
from app.apps.parties.models import Party

logger = logging.getLogger(__name__)

_URL_PATH = "/Handlers/SecureJson.ashx?file=JSONFiles/Election2082/Common/PRHoRPartyTop5.txt"


def _fetch_pr_json_data() -> list[dict[str, Any]]:
    """Fetch PR party vote data from the Election Commission."""
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

    url = f"{BASE_URL}{_URL_PATH}"
    resp = session.get(url, headers=headers, timeout=180)
    resp.raise_for_status()
    raw = resp.content.decode("utf-8-sig")

    data = json.loads(raw)
    if isinstance(data, dict) and "data" in data:
        data = data["data"]
    if not isinstance(data, list):
        raise ValueError(f"Expected list, got {type(data).__name__}")

    logger.info("Successfully fetched %d PR party records", len(data))
    return data


def _update_parties(data: list[dict[str, Any]]) -> int:
    """Update pr_votes_received for existing parties matched by name_ne."""
    updated_count = 0
    for row in data:
        party_name = str(row.get("PoliticalPartyName") or "").strip()
        votes = int(row.get("TotalVoteReceived") or 0)
        if not party_name:
            continue
        try:
            party = Party.objects.get(name_ne=party_name)
        except Party.DoesNotExist:
            logger.warning("PR result: no party found for '%s'", party_name)
            continue
        if party.pr_votes_received != votes:
            party.pr_votes_received = votes
            party.save(update_fields=["pr_votes_received"])
            updated_count += 1
    return updated_count


def fetch_pr_results() -> FetchResult:
    """
    Main entry point: fetch PR party votes and update parties.
    Returns a FetchResult with success/failure info.
    Always logs to ResultFetchLog.
    """
    start_time = time.monotonic()
    source_url = f"{BASE_URL}{_URL_PATH}"

    try:
        data = _fetch_pr_json_data()
        parties_updated = _update_parties(data)
        duration = time.monotonic() - start_time

        result = FetchResult(
            success=True,
            records_fetched=len(data),
            parties_updated=parties_updated,
            duration_seconds=duration,
        )
        ResultFetchLog.objects.create(
            success=True,
            source_url=source_url,
            records_fetched=len(data),
            candidates_updated=parties_updated,
            duration_seconds=duration,
        )
        notify_discord(result, label="PR Party Votes")
        return result

    except Exception as e:
        duration = time.monotonic() - start_time
        error_msg = f"{type(e).__name__}: {e}"
        logger.exception("Failed to fetch PR results")

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
