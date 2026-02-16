import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from django.db import transaction

from app.apps.candidates.models import Candidate, ElectionType, Gender
from app.apps.elections.models import Constituency, District, Election, Province
from app.apps.parties.models import Party

GENDER_MAP: dict[str, str] = {
    "पुरुष": Gender.MALE,
    "महिला": Gender.FEMALE,
    "अन्य": Gender.OTHER,
}


@dataclass
class ImportResult:
    provinces: int
    districts: int
    constituencies: int
    parties: int
    candidates_created: int
    candidates_updated: int


def _clean_text(value: Any) -> str:
    """Clean a text value: convert None/'0'/'-' to empty string."""
    if value is None:
        return ""
    text = str(value).strip()
    if text in ("0", "-"):
        return ""
    return text


def import_fptp_from_json(file_path: str, election_slug: str) -> ImportResult:
    """
    Import FPTP candidates from the official Election Commission JSON file.
    Creates Province, District, Constituency, Party, and Candidate records.
    Idempotent: uses get_or_create / update_or_create throughout.
    """
    path = Path(file_path)
    with path.open(encoding="utf-8-sig") as f:
        data: list[dict[str, Any]] = json.load(f)

    election = Election.objects.get(slug=election_slug)

    province_cache: dict[int, Province] = {}
    district_cache: dict[str, District] = {}
    constituency_cache: dict[tuple[str, int], Constituency] = {}
    party_cache: dict[str, Party] = {}

    # First pass: build lookup tables
    for row in data:
        state_id = int(row["STATE_ID"])
        if state_id not in province_cache:
            province_cache[state_id], _ = Province.objects.get_or_create(
                source_id=state_id,
                defaults={"name": row["StateName"], "name_ne": row["StateName"]},
            )

        district_name = row["DistrictName"]
        if district_name not in district_cache:
            district_cache[district_name], _ = District.objects.get_or_create(
                province=province_cache[state_id],
                name_ne=district_name,
                defaults={"name": district_name},
            )

        const_number = int(row["ConstName"])
        const_key = (district_name, const_number)
        if const_key not in constituency_cache:
            constituency_cache[const_key], _ = Constituency.objects.get_or_create(
                district=district_cache[district_name],
                number=const_number,
            )

        party_name = row["PoliticalPartyName"]
        if party_name not in party_cache:
            party_cache[party_name], _ = Party.objects.get_or_create(
                name_ne=party_name,
                defaults={"name": ""},
            )

    # Second pass: create candidates in bulk
    candidates_to_create: list[Candidate] = []
    source_ids_seen: set[int] = set()
    created_count = 0
    updated_count = 0

    with transaction.atomic():
        existing_source_ids = set(
            Candidate.objects.filter(
                election=election, election_type=ElectionType.FPTP
            ).values_list("source_id", flat=True)
        )

        for row in data:
            source_id = int(row["CandidateID"])
            if source_id in source_ids_seen:
                continue
            source_ids_seen.add(source_id)

            district_name = row["DistrictName"]
            const_number = int(row["ConstName"])
            party_name = row["PoliticalPartyName"]
            gender_ne = row["Gender"]

            candidate_data = {
                "election": election,
                "election_type": ElectionType.FPTP,
                "name_ne": row["CandidateName"],
                "age": int(row["AGE_YR"]) if row["AGE_YR"] else None,
                "gender": GENDER_MAP.get(gender_ne, Gender.OTHER),
                "father_name": _clean_text(row.get("FATHER_NAME")),
                "spouse_name": _clean_text(row.get("SPOUCE_NAME")),
                "address": _clean_text(row.get("ADDRESS")),
                "citizenship_district": _clean_text(row.get("CTZDIST")),
                "qualification": _clean_text(row.get("QUALIFICATION")),
                "institution": _clean_text(row.get("NAMEOFINST")),
                "experience": _clean_text(row.get("EXPERIENCE")),
                "other_details": _clean_text(row.get("OTHERDETAILS")),
                "party": party_cache[party_name],
                "election_symbol_code": int(row["SYMBOLCODE"]) if row.get("SYMBOLCODE") else None,
                "election_symbol_name": _clean_text(row.get("SymbolName")),
                "constituency": constituency_cache[(district_name, const_number)],
                "votes_received": int(row.get("TotalVoteReceived") or 0),
                "status": _clean_text(row.get("E_STATUS")),
            }

            if source_id not in existing_source_ids:
                candidates_to_create.append(Candidate(source_id=source_id, **candidate_data))
            else:
                Candidate.objects.filter(election=election, source_id=source_id).update(
                    **candidate_data
                )
                updated_count += 1

        if candidates_to_create:
            Candidate.objects.bulk_create(candidates_to_create)
            created_count = len(candidates_to_create)

    return ImportResult(
        provinces=len(province_cache),
        districts=len(district_cache),
        constituencies=len(constituency_cache),
        parties=len(party_cache),
        candidates_created=created_count,
        candidates_updated=updated_count,
    )
