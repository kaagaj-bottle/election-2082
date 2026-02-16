from __future__ import annotations

from rest_framework import serializers

from app.apps.candidates.models import Candidate
from app.apps.elections.serializers import (
    ConstituencySerializer,
    ElectionListSerializer,
)
from app.apps.parties.serializers import PartySerializer


class CandidateListSerializer(serializers.ModelSerializer[Candidate]):
    party = PartySerializer(read_only=True)
    constituency = ConstituencySerializer(read_only=True)

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


class CandidateDetailSerializer(serializers.ModelSerializer[Candidate]):
    party = PartySerializer(read_only=True)
    constituency = ConstituencySerializer(read_only=True)
    election = ElectionListSerializer(read_only=True)

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
            "spouse_name",
            "address",
            "citizenship_district",
            "qualification",
            "institution",
            "experience",
            "other_details",
            "party",
            "election_symbol_code",
            "election_symbol_name",
            "constituency",
            "votes_received",
            "status",
            "closed_list_rank",
            "voter_id",
            "inclusion_group",
            "has_disability",
            "photo_url",
        ]
