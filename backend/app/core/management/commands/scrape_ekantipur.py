"""Scrape English candidate data from election.ekantipur.com."""

import json
import re
import time
from pathlib import Path
from typing import Any

import requests
from bs4 import BeautifulSoup
from django.core.management.base import BaseCommand, CommandParser

BASE_URL = "https://election.ekantipur.com"
OUTPUT_FILE = Path(__file__).resolve().parents[4] / "ekantipur_english_data.json"

# Nepali digit → Arabic digit
NEPALI_DIGITS = str.maketrans("०१२३४५६७८९", "0123456789")


def _parse_constituency(text: str) -> tuple[str, int]:
    """Parse 'Taplejung-1 ( Koshi Province )' → ('Taplejung', 1)."""
    text = text.strip()
    # Pattern: "District-Number ( Province )"
    m = re.match(r"(.+?)-(\d+)\s*\(", text)
    if m:
        return m.group(1).strip(), int(m.group(2))
    # Nepali format: "ताप्लेजुङ-१ ( कोशी प्रदेश )"
    text_ascii = text.translate(NEPALI_DIGITS)
    m = re.match(r"(.+?)-(\d+)\s*\(", text_ascii)
    if m:
        return m.group(1).strip(), int(m.group(2))
    return text, 0


def _table_to_dict(table: Any) -> dict[str, str]:
    """Extract label→value dict from a two-column table."""
    result: dict[str, str] = {}
    if table is None:
        return result
    for row in table.find_all("tr"):
        cells = row.find_all("td")
        if len(cells) >= 2:
            label = cells[0].get_text(strip=True)
            value = cells[1].get_text(strip=True)
            result[label] = value
    return result


def _fetch_page(url: str, session: requests.Session, retries: int = 3) -> str | None:
    """Fetch a URL with retries."""
    for attempt in range(retries):
        try:
            resp = session.get(url, timeout=15)
            if resp.status_code == 200:
                return resp.text
            if resp.status_code == 404:
                return None
        except requests.RequestException:
            pass
        if attempt < retries - 1:
            time.sleep(2**attempt)
    return None


def _scrape_profile(profile_id: int, session: requests.Session) -> dict[str, Any] | None:
    """Scrape one candidate profile (English + Nepali pages)."""
    eng_html = _fetch_page(f"{BASE_URL}/profile/{profile_id}?lng=eng", session)
    if eng_html is None:
        return None

    time.sleep(0.3)

    nep_html = _fetch_page(f"{BASE_URL}/profile/{profile_id}?lng=nep", session)
    if nep_html is None:
        return None

    eng_soup = BeautifulSoup(eng_html, "html.parser")
    nep_soup = BeautifulSoup(nep_html, "html.parser")

    record: dict[str, Any] = {"ekantipur_id": profile_id}

    # --- English page ---
    # Candidate name
    name_h2 = eng_soup.select_one(".candidate-name h2")
    record["name_en"] = name_h2.get_text(strip=True) if name_h2 else ""

    # Party name from img alt
    party_img = eng_soup.select_one(".party-sign img")
    record["party_name_en"] = party_img["alt"] if party_img and party_img.get("alt") else ""

    # Election results table
    result_section = eng_soup.select_one("#candidateResult")
    result_data = _table_to_dict(result_section.find("table") if result_section else None)

    constituency_str = result_data.get("Electoral Constituency", "")
    district_en, const_number = _parse_constituency(constituency_str)
    record["district_en"] = district_en
    record["constituency_number"] = const_number
    record["constituency_raw"] = constituency_str

    # Party name from table (backup, sometimes more complete)
    table_party = result_data.get("Political Party", "")
    if table_party and (
        not record["party_name_en"] or len(table_party) > len(record["party_name_en"])
    ):
        record["party_name_en"] = table_party

    # Personal info table
    info_section = eng_soup.select_one("#candidatePersonalInfo")
    info_data = _table_to_dict(info_section.find("table") if info_section else None)

    record["father_name_en"] = info_data.get("Father, Mother", "")
    record["spouse_en"] = info_data.get("Spouse", "")
    record["address_en"] = info_data.get("Address", "")
    record["qualification_en"] = info_data.get("Education", "")
    record["birth_place_en"] = info_data.get("Birth Place", "")
    record["birth_date"] = info_data.get("Birth Date", "")

    # Bio paragraph
    bio_div = eng_soup.select_one(".candidate-basic-info")
    record["bio_en"] = bio_div.get_text(strip=True) if bio_div else ""

    # --- Nepali page ---
    nep_name_h2 = nep_soup.select_one(".candidate-name h2")
    record["name_ne"] = nep_name_h2.get_text(strip=True) if nep_name_h2 else ""

    nep_party_img = nep_soup.select_one(".party-sign img")
    record["party_name_ne"] = (
        nep_party_img["alt"] if nep_party_img and nep_party_img.get("alt") else ""
    )

    # Nepali constituency
    nep_result_section = nep_soup.select_one("#candidateResult")
    nep_result_data = _table_to_dict(
        nep_result_section.find("table") if nep_result_section else None
    )
    nep_constituency_str = nep_result_data.get("निर्वाचन क्षेत्र", "")
    district_ne, _ = _parse_constituency(nep_constituency_str)
    record["district_ne"] = district_ne

    # Nepali personal info
    nep_info_section = nep_soup.select_one("#candidatePersonalInfo")
    nep_info_data = _table_to_dict(nep_info_section.find("table") if nep_info_section else None)
    record["father_name_ne"] = nep_info_data.get("बाबु, आमा", "")
    record["address_ne"] = nep_info_data.get("ठेगाना", "")
    record["qualification_ne"] = nep_info_data.get("शिक्षा", "")

    return record


class Command(BaseCommand):
    help = "Scrape English candidate data from election.ekantipur.com"

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "--start", type=int, default=1, help="Starting profile ID (default: 1)"
        )
        parser.add_argument(
            "--end", type=int, default=3406, help="Ending profile ID (default: 3406)"
        )
        parser.add_argument(
            "--resume",
            action="store_true",
            help="Skip already-scraped IDs (reads existing output file).",
        )
        parser.add_argument(
            "--delay",
            type=float,
            default=1.0,
            help="Delay in seconds between profiles (default: 1.0).",
        )
        parser.add_argument(
            "--output",
            type=str,
            default=str(OUTPUT_FILE),
            help="Output JSON file path.",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        start: int = options["start"]
        end: int = options["end"]
        resume: bool = options["resume"]
        delay: float = options["delay"]
        output_path = Path(options["output"])

        # Load existing data if resuming
        existing: list[dict[str, Any]] = []
        scraped_ids: set[int] = set()
        if resume and output_path.exists():
            with output_path.open(encoding="utf-8") as f:
                existing = json.load(f)
            scraped_ids = {r["ekantipur_id"] for r in existing}
            self.stdout.write(f"Resuming: {len(scraped_ids)} profiles already scraped.")

        results = list(existing)
        session = requests.Session()
        session.headers["User-Agent"] = "Mozilla/5.0 (compatible; ElectionResearch/1.0)"

        total = end - start + 1
        success = 0
        skipped = 0
        errors = 0

        for profile_id in range(start, end + 1):
            if profile_id in scraped_ids:
                skipped += 1
                continue

            record = _scrape_profile(profile_id, session)
            if record:
                results.append(record)
                success += 1
            else:
                errors += 1
                self.stderr.write(f"  FAILED: profile {profile_id}")

            done = profile_id - start + 1
            if done % 50 == 0 or profile_id == end:
                self.stdout.write(
                    f"  Progress: {done}/{total} (ok={success}, skip={skipped}, err={errors})"
                )
                # Save intermediate results
                with output_path.open("w", encoding="utf-8") as f:
                    json.dump(results, f, ensure_ascii=False, indent=2)

            if profile_id < end and profile_id not in scraped_ids:
                time.sleep(delay)

        # Final save
        with output_path.open("w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

        self.stdout.write(
            self.style.SUCCESS(
                f"Done! Scraped {success} profiles, {errors} errors, {skipped} skipped. "
                f"Output: {output_path}"
            )
        )
