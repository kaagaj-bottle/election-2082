from __future__ import annotations

from django.db.models import Count, QuerySet
from rest_framework.viewsets import ReadOnlyModelViewSet

from app.apps.parties.models import Party
from app.apps.parties.serializers import PartyDetailSerializer, PartySerializer


class PartyViewSet(ReadOnlyModelViewSet[Party]):
    def get_queryset(self) -> QuerySet[Party]:
        qs = Party.objects.all()
        if self.action == "retrieve":
            qs = qs.annotate(candidate_count=Count("candidates"))
        return qs

    def get_serializer_class(self) -> type[PartySerializer | PartyDetailSerializer]:
        if self.action == "retrieve":
            return PartyDetailSerializer
        return PartySerializer
