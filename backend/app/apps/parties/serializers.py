from __future__ import annotations

from django.db.models import Count
from rest_framework import serializers

from app.apps.parties.models import Party


class PartySerializer(serializers.ModelSerializer[Party]):
    class Meta:
        model = Party
        fields = ["id", "name_ne", "name"]


class PartyDetailSerializer(serializers.ModelSerializer[Party]):
    candidate_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Party
        fields = ["id", "name_ne", "name", "candidate_count"]

    @staticmethod
    def setup_eager_loading(queryset):  # type: ignore[no-untyped-def]
        return queryset.annotate(candidate_count=Count("candidates"))
