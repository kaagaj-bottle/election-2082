from __future__ import annotations

from rest_framework import serializers

from app.apps.candidates.models import Candidate
from app.apps.elections.serializers import (
    ConstituencySerializer,
    ElectionListSerializer,
)
from app.apps.parties.serializers import PartySerializer
from app.core.bilingual import BilingualMixin


class CandidateListSerializer(BilingualMixin, serializers.ModelSerializer[Candidate]):
    party = PartySerializer(read_only=True)
    constituency = ConstituencySerializer(read_only=True)

    bilingual_field_map = {
        "name": {"ne": "name_ne", "en": "name"},
    }

    class Meta:
        model = Candidate
        fields = [
            "id",
            "source_id",
            "name_ne",
            "name",
            "age",
            "gender",
            "election_type",
            "party",
            "constituency",
            "votes_received",
            "photo_url",
        ]


class CandidateDetailSerializer(BilingualMixin, serializers.ModelSerializer[Candidate]):
    party = PartySerializer(read_only=True)
    constituency = ConstituencySerializer(read_only=True)
    election = ElectionListSerializer(read_only=True)

    bilingual_field_map = {
        "name": {"ne": "name_ne", "en": "name"},
        "father_name": {"ne": "father_name", "en": "father_name_en"},
        "spouse_name": {"ne": "spouse_name", "en": "spouse_name_en"},
        "address": {"ne": "address", "en": "address_en"},
        "citizenship_district": {"ne": "citizenship_district", "en": "citizenship_district_en"},
        "qualification": {"ne": "qualification", "en": "qualification_en"},
        "institution": {"ne": "institution", "en": "institution_en"},
        "experience": {"ne": "experience", "en": "experience_en"},
        "other_details": {"ne": "other_details", "en": "other_details_en"},
        "election_symbol_name": {"ne": "election_symbol_name", "en": "election_symbol_name_en"},
        "inclusion_group": {"ne": "inclusion_group", "en": "inclusion_group_en"},
    }

    class Meta:
        model = Candidate
        fields = [
            "id",
            "source_id",
            "election",
            "election_type",
            "name_ne",
            "name",
            "age",
            "gender",
            "father_name",
            "father_name_en",
            "spouse_name",
            "spouse_name_en",
            "address",
            "address_en",
            "citizenship_district",
            "citizenship_district_en",
            "qualification",
            "qualification_en",
            "institution",
            "institution_en",
            "experience",
            "experience_en",
            "other_details",
            "other_details_en",
            "party",
            "election_symbol_code",
            "election_symbol_name",
            "election_symbol_name_en",
            "constituency",
            "votes_received",
            "status",
            "closed_list_rank",
            "voter_id",
            "inclusion_group",
            "inclusion_group_en",
            "has_disability",
            "photo_url",
        ]
