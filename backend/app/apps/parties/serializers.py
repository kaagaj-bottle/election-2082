from __future__ import annotations

from rest_framework import serializers

from app.apps.parties.models import Party
from app.core.bilingual import BilingualMixin

_NAME_BILINGUAL = {
    "name": {"ne": "name_ne", "en": "name"},
}


class PartySerializer(BilingualMixin, serializers.ModelSerializer[Party]):
    bilingual_field_map = _NAME_BILINGUAL

    class Meta:
        model = Party
        fields = ["id", "name_ne", "name", "symbol_image", "pr_votes_received"]


class PartyDetailSerializer(BilingualMixin, serializers.ModelSerializer[Party]):
    candidate_count = serializers.IntegerField(read_only=True)
    bilingual_field_map = _NAME_BILINGUAL

    class Meta:
        model = Party
        fields = ["id", "name_ne", "name", "symbol_image", "pr_votes_received", "candidate_count"]
