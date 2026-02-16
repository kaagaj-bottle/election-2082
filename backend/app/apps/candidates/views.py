from __future__ import annotations

from django.db.models import QuerySet
from rest_framework.viewsets import ReadOnlyModelViewSet

from app.apps.candidates.filters import CandidateFilterSet
from app.apps.candidates.models import Candidate
from app.apps.candidates.serializers import CandidateDetailSerializer, CandidateListSerializer


class CandidateViewSet(ReadOnlyModelViewSet[Candidate]):
    filterset_class = CandidateFilterSet
    ordering_fields = ["id", "name_ne", "age", "votes_received"]

    def get_queryset(self) -> QuerySet[Candidate]:
        return Candidate.objects.select_related(
            "party", "constituency__district__province", "election"
        ).all()

    def get_serializer_class(
        self,
    ) -> type[CandidateListSerializer | CandidateDetailSerializer]:
        if self.action == "retrieve":
            return CandidateDetailSerializer
        return CandidateListSerializer
