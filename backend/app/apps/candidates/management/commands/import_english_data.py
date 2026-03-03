"""Import scraped English data from ekantipur into the database."""

import json
import re
from collections import Counter
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any

from django.core.management.base import BaseCommand, CommandParser

from app.apps.candidates.models import Candidate
from app.apps.parties.models import Party
from app.core.management.commands.transliterate_all import DISTRICT_NAMES

DEFAULT_INPUT = Path(__file__).resolve().parents[5] / "ekantipur_english_data.json"

# Regex to detect Devanagari characters
DEVANAGARI_RE = re.compile(r"[\u0900-\u097F]")

# Normalize scraped district names that differ from our DB English names
_DISTRICT_ALIASES: dict[str, str] = {
    "illam": "ilam",
}


def _is_latin(text: str) -> bool:
    """Return True if the text does not contain Devanagari characters."""
    return bool(text) and not DEVANAGARI_RE.search(text)


def _normalize_name(name: str) -> str:
    """Normalize a name for fuzzy comparison."""
    return re.sub(r"\s+", " ", name.strip().lower())


def _name_similarity(a: str, b: str) -> float:
    """Compute similarity ratio between two names."""
    return SequenceMatcher(None, _normalize_name(a), _normalize_name(b)).ratio()


def _match_candidate(
    record: dict[str, Any],
    constituency_candidates: dict[tuple[str, int], list[Candidate]],
) -> Candidate | None:
    """Match a scraped record to a DB candidate using constituency + name."""
    district_en = record.get("district_en", "")
    const_number = record.get("constituency_number", 0)
    name_ne = record.get("name_ne", "")

    if not district_en or not const_number:
        return None

    # Normalize district name (lowercase + alias)
    district_key = _DISTRICT_ALIASES.get(district_en.lower(), district_en.lower())
    candidates = constituency_candidates.get((district_key, const_number), [])

    if not candidates:
        return None

    # Try exact name_ne match
    if name_ne:
        for c in candidates:
            if c.name_ne == name_ne:
                return c

    # Fuzzy match on name_ne
    if name_ne:
        best_match: Candidate | None = None
        best_score = 0.0
        for c in candidates:
            score = _name_similarity(name_ne, c.name_ne)
            if score > best_score:
                best_score = score
                best_match = c
        if best_score >= 0.7:
            return best_match

    # Fuzzy match on English name (compare with transliterated name in DB)
    name_en = record.get("name_en", "")
    if name_en:
        best_match = None
        best_score = 0.0
        for c in candidates:
            if c.name:
                score = _name_similarity(name_en, c.name)
                if score > best_score:
                    best_score = score
                    best_match = c
        if best_score >= 0.6:
            return best_match

    return None


class Command(BaseCommand):
    help = "Import scraped English data from ekantipur into the database."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "--input",
            type=str,
            default=str(DEFAULT_INPUT),
            help="Path to ekantipur_english_data.json",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Preview matches without writing to DB.",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        input_path = Path(options["input"])
        dry_run: bool = options["dry_run"]

        if not input_path.exists():
            self.stderr.write(self.style.ERROR(f"File not found: {input_path}"))
            return

        with input_path.open(encoding="utf-8") as f:
            records: list[dict[str, Any]] = json.load(f)

        self.stdout.write(f"Loaded {len(records)} scraped records.")

        # Build constituency → candidates lookup (keyed by English district name)
        candidates = list(
            Candidate.objects.select_related("party", "constituency__district").all()
        )
        constituency_candidates: dict[tuple[str, int], list[Candidate]] = {}
        for c in candidates:
            if c.constituency:
                district = c.constituency.district
                canonical = DISTRICT_NAMES.get(district.name_ne, district.name or "")
                key = (canonical.lower(), c.constituency.number)
                constituency_candidates.setdefault(key, []).append(c)

        self.stdout.write(
            f"DB has {len(candidates)} candidates in "
            f"{len(constituency_candidates)} constituencies."
        )

        # Match and collect updates
        matched_candidates: list[tuple[Candidate, dict[str, Any]]] = []
        unmatched: list[dict[str, Any]] = []
        party_en_votes: dict[int, Counter[str]] = {}  # party_id → Counter of en names

        for record in records:
            candidate = _match_candidate(record, constituency_candidates)
            if candidate:
                matched_candidates.append((candidate, record))
                # Track party English names
                party_name_en = record.get("party_name_en", "")
                if party_name_en:
                    pid = candidate.party.id
                    if pid not in party_en_votes:
                        party_en_votes[pid] = Counter()
                    party_en_votes[pid][party_name_en] += 1
            else:
                unmatched.append(record)

        self.stdout.write(f"Matched: {len(matched_candidates)}, Unmatched: {len(unmatched)}")

        if unmatched:
            show = unmatched if len(unmatched) <= 20 else unmatched[:20]
            if len(unmatched) > 20:
                self.stdout.write(f"  (showing first 20 of {len(unmatched)} unmatched)")
            else:
                self.stdout.write("Unmatched records:")
            for r in show:
                self.stdout.write(
                    f"  #{r.get('ekantipur_id')}: {r.get('name_en', '?')}"
                    f" — {r.get('district_en', '?')}-"
                    f"{r.get('constituency_number', '?')}"
                )

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run — no changes written."))
            return

        # Update candidates
        updated_candidates: list[Candidate] = []
        update_fields = [
            "name",
            "father_name_en",
            "spouse_name_en",
            "address_en",
            "qualification_en",
            "institution_en",
            "experience_en",
            "other_details_en",
        ]
        fields_updated = 0

        for candidate, record in matched_candidates:
            changed = False

            # Always update English name
            name_en = record.get("name_en", "")
            if name_en and name_en != candidate.name:
                candidate.name = name_en
                changed = True
                fields_updated += 1

            # Only update biographical fields if they're in Latin script
            field_map = [
                ("father_name_en", "father_name_en"),
                ("spouse_en", "spouse_name_en"),
                ("address_en", "address_en"),
                ("qualification_en", "qualification_en"),
            ]
            for src_key, model_field in field_map:
                value = record.get(src_key, "")
                if value and _is_latin(value):
                    setattr(candidate, model_field, value)
                    changed = True
                    fields_updated += 1

            if changed:
                updated_candidates.append(candidate)

        if updated_candidates:
            Candidate.objects.bulk_update(updated_candidates, update_fields, batch_size=500)
        self.stdout.write(f"  Candidates updated: {len(updated_candidates)}")
        self.stdout.write(f"  Fields updated: {fields_updated}")

        # Update parties
        parties_updated = 0
        for party_id, name_counter in party_en_votes.items():
            best_name = name_counter.most_common(1)[0][0]
            if best_name:
                Party.objects.filter(id=party_id).update(name=best_name)
                parties_updated += 1

        self.stdout.write(f"  Parties updated: {parties_updated}")

        # Apply hardcoded party names as override
        from app.core.management.commands.transliterate_all import PARTY_NAMES

        if PARTY_NAMES:
            overrides = 0
            for party in Party.objects.all():
                official_name = PARTY_NAMES.get(party.name_ne)
                if official_name and party.name != official_name:
                    party.name = official_name
                    party.save(update_fields=["name"])
                    overrides += 1
            if overrides:
                self.stdout.write(f"  Party name overrides applied: {overrides}")

        self.stdout.write(self.style.SUCCESS("Import complete."))
