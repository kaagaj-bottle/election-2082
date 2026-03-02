"""Management command to populate English fields from Nepali text."""

from typing import Any

from django.core.management.base import BaseCommand

from app.apps.candidates.models import Candidate
from app.apps.elections.models import District, Province
from app.apps.parties.models import Party
from app.core.transliterate import transliterate

# Official English names for all 7 provinces
PROVINCE_NAMES: dict[int, str] = {
    1: "Koshi",
    2: "Madhesh",
    3: "Bagmati",
    4: "Gandaki",
    5: "Lumbini",
    6: "Karnali",
    7: "Sudurpashchim",
}

# Official English names for all 77 districts, keyed by Nepali name
DISTRICT_NAMES: dict[str, str] = {
    # Koshi Province
    "ताप्लेजुङ": "Taplejung",
    "पाँचथर": "Panchthar",
    "इलाम": "Ilam",
    "झापा": "Jhapa",
    "मोरङ": "Morang",
    "सुनसरी": "Sunsari",
    "धनकुटा": "Dhankuta",
    "तेह्रथुम": "Terhathum",
    "भोजपुर": "Bhojpur",
    "संखुवासभा": "Sankhuwasabha",
    "सोलुखुम्बु": "Solukhumbu",
    "ओखलढुङ्गा": "Okhaldhunga",
    "ओखलढुंगा": "Okhaldhunga",
    "खोटाङ": "Khotang",
    "उदयपुर": "Udayapur",
    # Madhesh Province
    "सप्तरी": "Saptari",
    "सिराहा": "Siraha",
    "धनुषा": "Dhanusha",
    "महोत्तरी": "Mahottari",
    "सर्लाही": "Sarlahi",
    "रौतहट": "Rautahat",
    "बारा": "Bara",
    "पर्सा": "Parsa",
    # Bagmati Province
    "दोलखा": "Dolakha",
    "सिन्धुपाल्चोक": "Sindhupalchok",
    "रामेछाप": "Ramechhap",
    "काभ्रेपलाञ्चोक": "Kavrepalanchok",
    "सिन्धुली": "Sindhuli",
    "मकवानपुर": "Makwanpur",
    "भक्तपुर": "Bhaktapur",
    "ललितपुर": "Lalitpur",
    "काठमाण्डौ": "Kathmandu",
    "काठमाडौँ": "Kathmandu",
    "काठमाडौं": "Kathmandu",
    "नुवाकोट": "Nuwakot",
    "रसुवा": "Rasuwa",
    "धादिङ": "Dhading",
    "चितवन": "Chitwan",
    # Gandaki Province
    "गोरखा": "Gorkha",
    "लमजुङ": "Lamjung",
    "तनहुँ": "Tanahun",
    "स्याङ्जा": "Syangja",
    "स्याङजा": "Syangja",
    "कास्की": "Kaski",
    "मनाङ": "Manang",
    "मुस्ताङ": "Mustang",
    "म्याग्दी": "Myagdi",
    "पर्वत": "Parbat",
    "बाग्लुङ": "Baglung",
    "नवलपरासी (बर्दघाट सुस्ता पूर्व)": "Nawalparasi East",
    # Lumbini Province
    "रुपन्देही": "Rupandehi",
    "रूपन्देही": "Rupandehi",
    "कपिलवस्तु": "Kapilvastu",
    "कपिलबस्तु": "Kapilvastu",
    "अर्घाखाँची": "Arghakhanchi",
    "गुल्मी": "Gulmi",
    "पाल्पा": "Palpa",
    "नवलपरासी (बर्दघाट सुस्ता पश्चिम)": "Nawalparasi West",
    "दाङ": "Dang",
    "प्यूठान": "Pyuthan",
    "रोल्पा": "Rolpa",
    "रुकुम (पूर्वी भाग)": "Rukum East",
    "बाँके": "Banke",
    "बर्दिया": "Bardiya",
    # Karnali Province
    "रुकुम पश्चिम": "Rukum West",
    "रुकुम (पश्चिमी भाग)": "Rukum West",
    "रुकुम (पश्चिम भाग)": "Rukum West",
    "सल्यान": "Salyan",
    "डोल्पा": "Dolpa",
    "हुम्ला": "Humla",
    "जुम्ला": "Jumla",
    "कालिकोट": "Kalikot",
    "मुगु": "Mugu",
    "सुर्खेत": "Surkhet",
    "दैलेख": "Dailekh",
    "जाजरकोट": "Jajarkot",
    # Sudurpashchim Province
    "कैलाली": "Kailali",
    "अछाम": "Achham",
    "डोटी": "Doti",
    "बझाङ": "Bajhang",
    "बाजुरा": "Bajura",
    "कञ्चनपुर": "Kanchanpur",
    "डडेलधुरा": "Dadeldhura",
    "बैतडी": "Baitadi",
    "दार्चुला": "Darchula",
}

# Official English names for all 66 parties, keyed by EC Nepali name.
# Used as authoritative override for ekantipur scrape and transliteration fallback.
PARTY_NAMES: dict[str, str] = {
    "नेपाल कम्युनिष्ट पार्टी (एकीकृत मार्क्सवादी लेनिनवादी)": "CPN (Unified Marxist-Leninist)",
    "नेपाली काँग्रेस": "Nepali Congress",
    "नेपाली कम्युनिष्ट पार्टी": "Communist Party of Nepal",
    "राष्ट्रिय स्वतन्त्र पार्टी": "Rastriya Swatantra Party",
    "राष्ट्रिय प्रजातन्त्र पार्टी": "Rastriya Prajatantra Party",
    "जनता समाजवादी पार्टी, नेपाल": "Janata Samajwadi Party, Nepal",
    "नेपाल कम्युनिस्ट पार्टी (माओवादी)": "Communist Party of Nepal (Maoist)",
    "राष्ट्रिय जनमोर्चा": "Rastriya Janamorcha",
    "जनमत पार्टी": "Janamat Party",
    "नागरिक उन्मुक्ति पार्टी, नेपाल(एकल चुनाव चिन्ह)": "Nagarik Unmukti Party, Nepal",
    "राष्ट्रिय जनता पार्टी नेपाल": "Rastriya Janata Party Nepal",
    "नेपाल मजदुर किसान पार्टी": "Nepal Majdoor Kisan Party",
    "श्रम संस्कृति पार्टी": "Shram Sanskriti Party",
    "राष्ट्रिय एकता दल": "Rastriya Ekta Dal",
    "स्वतन्त्र": "Independent",
    "लोकतान्त्रिक समाजवादी पार्टी, नेपाल": "Loktantrik Samajwadi Party, Nepal",
    "संघीय लोकतान्त्रिक राष्ट्रिय मञ्च": "Sanghiya Loktantrik Rastriya Manch",
    "नेपाल कम्युनिष्ट पार्टी (संयुक्त)": "CPN (United)",
    "नेपाल कम्युनिष्ट पार्टी मार्क्सवादी (पुष्पलाल)": "CPN Marxist (Pushpalal)",
    "नेपाल कम्युनिष्ट पार्टी (माक्र्सवादी)(एकल चुनाव चिन्ह)": "CPN (Marxist)",
    "राष्ट्रिय उर्जाशील पार्टी, नेपाल": "Rastriya Urjashil Party, Nepal",
    "राष्ट्रिय जनमत पार्टी": "Rastriya Janamat Party",
    "राष्ट्रिय जनमुक्ति पार्टी": "Rastriya Janamukti Party",
    "राष्ट्रिय परिवर्तन पार्टी": "Rastriya Pariwartan Party",
    "राष्ट्रिय साझा पार्टी": "Rastriya Sajha Party",
    "राष्ट्रिय मुक्ति आन्दोलन, नेपाल": "Rastriya Mukti Andolan, Nepal",
    "राष्ट्रिय मुक्ति पार्टी नेपाल(एकल चुनाव चिन्ह)": "Rastriya Mukti Party Nepal",
    " राष्ट्रिय नागरिक पार्टी": "Rastriya Nagarik Party",
    "राष्ट्र निर्माण दल नेपाल": "Rastra Nirman Dal Nepal",
    "नेपाल जनता पार्टी": "Nepal Janata Party",
    "नेपाल जनता संरक्षण पार्टी": "Nepal Janata Sanrakshan Party",
    "नेपाल जनमुक्ति पार्टी": "Nepal Janamukti Party",
    "नेपाल जनसेवा पार्टी": "Nepal Janasewa Party",
    "नेपाल मातृभूमि पार्टी": "Nepal Matribhumi Party",
    "नेपाल मानवतावादी पार्टी": "Nepal Manavtawadi Party",
    "नेपाल लोकतान्त्रिक पार्टी": "Nepal Loktantrik Party",
    "नेपाल संघीय समाजवादी पार्टी(एकल चुनाव चिन्ह)": "Nepal Sanghiya Samajwadi Party",
    "नेपाल सद्भावना पार्टी": "Nepal Sadbhawana Party",
    "नेपालका लागि नेपाली पार्टी": "Nepalka Lagi Nepali Party",
    "नेपाली जनता दल": "Nepali Janata Dal",
    "नेपाली जनश्रमदान संस्कृति पार्टी": "Nepali Janashramdan Sanskriti Party",
    "नेशनल रिपब्लिक नेपाल": "National Republic Nepal",
    "पिपुल फर्ष्ट पार्टी": "People First Party",
    "प्रगतिशील लोकतान्त्रिक पार्टी": "Pragatishil Loktantrik Party",
    "प्रजातान्त्रिक पार्टी नेपाल": "Prajatantrik Party Nepal",
    "आम जनता पार्टी(एकल चुनाव चिन्ह)": "Aam Janata Party",
    "इतिहासिक जनता पार्टी": "Itihasik Janata Party",
    "उज्यालो नेपाल पार्टी": "Ujyalo Nepal Party",
    "गतिशील लोकतान्त्रिक पार्टी": "Gatishil Loktantrik Party",
    "गान्धीवादी पार्टी नेपाल": "Gandhiwadi Party Nepal",
    "जन अधिकार पार्टी": "Jan Adhikar Party",
    "जनता लोकतान्त्रिक पार्टी, नेपाल": "Janata Loktantrik Party, Nepal",
    "जनता समाजवादी पार्टी(एकल चुनाव चिन्ह)": "Janata Samajwadi Party",
    "जनादेश पार्टी नेपाल(एकल चुनाव चिन्ह)": "Janadesh Party Nepal",
    "जय मातृभूमि पार्टी": "Jai Matribhumi Party",
    "त्रिमूल नेपाल": "Trimool Nepal",
    "नागरिक सर्वोच्चता पार्टी नेपाल(एकल चुनाव चिन्ह)": "Nagarik Sarvochata Party Nepal",
    "बहुजन एकता पार्टी नेपाल(एकल चुनाव चिन्ह)": "Bahujan Ekta Party Nepal",
    "बहुजन शक्ति पार्टी": "Bahujan Shakti Party",
    "मंगोल नेशनल अर्गनाइजेसन": "Mongol National Organisation",
    "मितेरी पार्टी नेपाल": "Miteri Party Nepal",
    "युनाईटेड नेपाल डिमोक्रयाटीक पार्टी": "United Nepal Democratic Party",
    "संयुक्त नागरिक पार्टी": "Sanyukta Nagarik Party",
    "समावेशी समाजवादी पार्टी": "Samabeshi Samajwadi Party",
    "समावेशी समाजवादी पार्टी नेपाल": "Samabeshi Samajwadi Party Nepal",
    "सार्वभौम नागरिक पार्टी": "Sarvabhaum Nagarik Party",
    "स्वाभिमान पार्टी": "Swabhiman Party",
}

# Candidate fields that need _en counterparts
CANDIDATE_EN_FIELDS = [
    ("father_name", "father_name_en"),
    ("spouse_name", "spouse_name_en"),
    ("address", "address_en"),
    ("citizenship_district", "citizenship_district_en"),
    ("qualification", "qualification_en"),
    ("institution", "institution_en"),
    ("experience", "experience_en"),
    ("other_details", "other_details_en"),
    ("election_symbol_name", "election_symbol_name_en"),
    ("inclusion_group", "inclusion_group_en"),
]


class Command(BaseCommand):
    help = "Populate English fields by transliterating Nepali text."

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument(
            "--force",
            action="store_true",
            help="Overwrite existing non-empty English values.",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        force: bool = options["force"]

        self._update_provinces(force)
        self._update_districts(force)
        self._update_parties(force)
        self._update_candidates(force)

        self.stdout.write(self.style.SUCCESS("Transliteration complete."))

    def _update_provinces(self, force: bool) -> None:
        provinces = Province.objects.all()
        updated: list[Province] = []
        for province in provinces:
            if not force and province.name and province.name != province.name_ne:
                continue
            english_name = PROVINCE_NAMES.get(province.source_id)
            if english_name:
                province.name = english_name
                updated.append(province)

        if updated:
            Province.objects.bulk_update(updated, ["name"], batch_size=500)
            self.stdout.write(f"  Provinces updated: {len(updated)}")
        else:
            self.stdout.write("  Provinces: nothing to update")

    def _update_districts(self, force: bool) -> None:
        districts = District.objects.all()
        updated: list[District] = []
        for district in districts:
            if not force and district.name and district.name != district.name_ne:
                continue
            english_name = DISTRICT_NAMES.get(district.name_ne)
            if english_name:
                district.name = english_name
            else:
                # Fallback to transliteration
                district.name = transliterate(district.name_ne)
            updated.append(district)

        if updated:
            District.objects.bulk_update(updated, ["name"], batch_size=500)
            self.stdout.write(f"  Districts updated: {len(updated)}")
        else:
            self.stdout.write("  Districts: nothing to update")

    def _update_parties(self, force: bool) -> None:
        parties = Party.objects.all()
        updated: list[Party] = []
        for party in parties:
            if not force and party.name:
                continue
            # Use hardcoded name first, fall back to transliteration
            official = PARTY_NAMES.get(party.name_ne)
            party.name = official if official else transliterate(party.name_ne)
            updated.append(party)

        if updated:
            Party.objects.bulk_update(updated, ["name"], batch_size=500)
            self.stdout.write(f"  Parties updated: {len(updated)}")
        else:
            self.stdout.write("  Parties: nothing to update")

    def _update_candidates(self, force: bool) -> None:
        candidates = Candidate.objects.all()
        updated: list[Candidate] = []
        update_fields = ["name"] + [en for _, en in CANDIDATE_EN_FIELDS]

        for candidate in candidates:
            changed = False

            # Name
            if force or not candidate.name:
                candidate.name = transliterate(candidate.name_ne)
                changed = True

            # All _en fields
            for ne_field, en_field in CANDIDATE_EN_FIELDS:
                if not force and getattr(candidate, en_field):
                    continue
                ne_value = getattr(candidate, ne_field)
                if ne_value:
                    setattr(candidate, en_field, transliterate(ne_value))
                    changed = True

            if changed:
                updated.append(candidate)

        if updated:
            Candidate.objects.bulk_update(updated, update_fields, batch_size=500)
            self.stdout.write(f"  Candidates updated: {len(updated)}")
        else:
            self.stdout.write("  Candidates: nothing to update")
