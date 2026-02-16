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
    "नुवाकोट": "Nuwakot",
    "रसुवा": "Rasuwa",
    "धादिङ": "Dhading",
    "चितवन": "Chitwan",
    # Gandaki Province
    "गोरखा": "Gorkha",
    "लमजुङ": "Lamjung",
    "तनहुँ": "Tanahun",
    "स्याङ्जा": "Syangja",
    "कास्की": "Kaski",
    "मनाङ": "Manang",
    "मुस्ताङ": "Mustang",
    "म्याग्दी": "Myagdi",
    "पर्वत": "Parbat",
    "बाग्लुङ": "Baglung",
    "नवलपरासी (बर्दघाट सुस्ता पूर्व)": "Nawalparasi East",
    # Lumbini Province
    "रुपन्देही": "Rupandehi",
    "कपिलवस्तु": "Kapilvastu",
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
            party.name = transliterate(party.name_ne)
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
