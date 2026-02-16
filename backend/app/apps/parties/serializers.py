from __future__ import annotations

from django.db.models import Count
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
        fields = ["id", "name_ne", "name"]


class PartyDetailSerializer(BilingualMixin, serializers.ModelSerializer[Party]):
    candidate_count = serializers.IntegerField(read_only=True)
    bilingual_field_map = _NAME_BILINGUAL

    class Meta:
        model = Party
        fields = ["id", "name_ne", "name", "candidate_count"]

    @staticmethod
    def setup_eager_loading(queryset):  # type: ignore[no-untyped-def]
        return queryset.annotate(candidate_count=Count("candidates"))
