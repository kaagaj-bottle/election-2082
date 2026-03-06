from __future__ import annotations

import urllib.request
from pathlib import Path

from django.core.management.base import BaseCommand

from app.apps.parties.models import Party

BASE_URL = "https://assets-generalelection2082.ekantipur.com/parties"

# Ekantipur party name -> image filename (scraped from election.ekantipur.com)
EKANTIPUR_PARTIES: dict[str, str] = {
    "नेकपा (एमाले)": "party-1770710534.png",
    "नेपाली काँग्रेस": "party-1770710566.png",
    "राष्ट्रिय प्रजातन्त्र पार्टी": "party-1770793829.png",
    "मंगोल नेशनल अर्गनाइजेसन": "party-1770793489.png",
    "संघीय लोकतान्त्रिक राष्ट्रिय मञ्च": "party-1770793926.png",
    "जनता समाजवादी पार्टी, नेपाल": "party-1770792403.png",
    "राष्ट्रिय स्वतन्त्र पार्टी": "party-1770792349.png",
    "जनता समाजवादी पार्टी(एकल चुनाव चिन्ह)": "party-1772010849.png",
    "नेपाली कम्युनिष्ट पार्टी": "party-1770793102.png",
    "नेपाल जनमुक्ति पार्टी": "party-1771920124.png",
    "श्रम संस्कृति पार्टी": "party-1770793904.png",
    "नेपाल कम्युनिस्ट पार्टी (माओवादी)": "party-1770797745.png",
    "उज्यालो नेपाल पार्टी": "party-1770794244.png",
    "नेपाल मजदुर किसान पार्टी": "party-1770792272.png",
    "प्रगतिशील लोकतान्त्रिक पार्टी": "party-1770797797.png",
    "राष्ट्रिय परिवर्तन पार्टी": "party-1770793782.png",
    "राष्ट्रिय मुक्ति पार्टी नेपाल(एकल चुनाव चिन्ह)": "party-1772011143.jpg",
    "राष्ट्रिय जनमुक्ति पार्टी": "party-1770793745.png",
    "स्वतन्त्र": "party-1770810367.png",
    "नेपाल कम्युनिष्ट पार्टी (संयुक्त)": "party-1770792701.png",
    "जनमत पार्टी": "party-1770792211.png",
    "नेशनल रिपब्लिक नेपाल": "party-1770793215.png",
    "पिपुल फर्ष्ट पार्टी": "party-1770793234.png",
    "राष्ट्रिय जनमोर्चा": "party-1771920192.png",
    "नेपाली जनश्रमदान संस्कृति पार्टी": "party-1772011456.jpg",
    "आम जनता पार्टी(एकल चुनाव चिन्ह)": "party-1770792474.png",
    "मितेरी पार्टी नेपाल": "party-1770793631.png",
    "संयुक्त नागरिक पार्टी": "party-1770793963.png",
    "जय मातृभूमि पार्टी": "party-1770792551.png",
    "नागरिक उन्मुक्ति पार्टी, नेपाल(एकल चुनाव चिन्ह)": "party-1770792624.png",
    "राष्ट्र निर्माण दल नेपाल": "party-1770793655.png",
    "समावेशी समाजवादी पार्टी": "party-1772013461.png",
    "नागरिक उन्मुक्ति पार्टी": "party-1772012045.jpg",
    "सार्वभौम नागरिक पार्टी": "party-1770794010.png",
    "राष्ट्रिय साझा पार्टी": "party-1771920245.png",
    "नेपाल जनता पार्टी": "party-1770792760.png",
    "नेपाली जनता दल": "party-1770793165.png",
    "नेपाल जनता संरक्षण पार्टी": "party-1770792777.png",
    "स्वाभिमान पार्टी": "party-1770797851.png",
    "नेपाल संघीय समाजवादी पार्टी(एकल चुनाव चिन्ह)": "party-1770793037.png",
    "नेपालका लागि नेपाली पार्टी": "party-1770793078.png",
    "जन अधिकार पार्टी": "party-1770792496.png",
    "जनता लोकतान्त्रिक पार्टी, नेपाल": "party-1770792521.png",
    "बहुजन एकता पार्टी नेपाल(एकल चुनाव चिन्ह)": "party-1771920309.png",
    "जनादेश पार्टी नेपाल(एकल चुनाव चिन्ह)": "party-1772013190.png",
    "राष्ट्रिय मुक्ति आन्दोलन, नेपाल": "party-1772013445.jpg",
    "गतिशील लोकतान्त्रिक पार्टी": "party-1770792333.png",
    "युनाईटेड नेपाल डिमोक्रयाटीक पार्टी": "party-1771920380.png",
    "नेपाल जनसेवा पार्टी": "party-1771920403.png",
    "त्रिमूल नेपाल": "party-1770792598.png",
    "नेपाल कम्युनिष्ट पार्टी (माक्र्सवादी)(एकल चुनाव चिन्ह)": "party-1772013752.jpg",
    "राष्ट्रिय नागरिक पार्टी": "party-1772013800.jpg",
}

# DB name_ne -> Ekantipur name (for parties where names differ)
MANUAL_OVERRIDES: dict[str, str] = {
    "नेपाल कम्युनिष्ट पार्टी (एकीकृत मार्क्सवादी लेनिनवादी)": "नेकपा (एमाले)",
}


class Command(BaseCommand):
    help = "Download party symbol images from Ekantipur election portal"

    def add_arguments(self, parser):  # type: ignore[no-untyped-def]
        parser.add_argument(
            "--output-dir",
            default=str(
                Path(__file__).resolve().parents[6] / "frontend" / "public" / "party-symbols"
            ),
            help="Directory to save images",
        )

    def handle(self, *args, **options) -> None:  # type: ignore[no-untyped-def]
        output_dir = Path(options["output_dir"])
        output_dir.mkdir(parents=True, exist_ok=True)

        parties = Party.objects.all()
        matched = 0
        downloaded = 0
        skipped = []

        for party in parties:
            name = party.name_ne.strip()

            # Check manual overrides first, then exact match
            ek_name = MANUAL_OVERRIDES.get(name, name)
            image_file = EKANTIPUR_PARTIES.get(ek_name)

            if not image_file:
                skipped.append(f"  {party.id}: {name}")
                continue

            matched += 1
            ext = image_file.rsplit(".", 1)[-1]
            local_filename = f"{party.id}.{ext}"
            local_path = output_dir / local_filename

            if local_path.exists():
                self.stdout.write(f"  Already exists: {local_filename}")
                party.symbol_image = local_filename
                party.save(update_fields=["symbol_image"])
                downloaded += 1
                continue

            url = f"{BASE_URL}/{image_file}"
            try:
                req = urllib.request.Request(
                    url,
                    headers={"User-Agent": "Mozilla/5.0"},
                )
                with urllib.request.urlopen(req) as resp:
                    local_path.write_bytes(resp.read())
                party.symbol_image = local_filename
                party.save(update_fields=["symbol_image"])
                downloaded += 1
                self.stdout.write(f"  Downloaded: {local_filename}")
            except Exception as e:
                self.stderr.write(f"  FAILED: {party.id} - {e}")

        self.stdout.write("")
        self.stdout.write(f"Matched: {matched}/{parties.count()}")
        self.stdout.write(f"Downloaded: {downloaded}")
        if skipped:
            self.stdout.write(f"Unmatched ({len(skipped)}):")
            for db_id_name in skipped:
                self.stdout.write(db_id_name)
