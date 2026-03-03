from __future__ import annotations

from django.db.models import (
    Avg,
    Case,
    Count,
    Max,
    Min,
    QuerySet,
    Value,
    When,
)
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.viewsets import ReadOnlyModelViewSet

from app.apps.candidates.filters import CandidateFilterSet
from app.apps.candidates.models import Candidate, ElectionType
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

    @action(detail=False, methods=["get"])
    def stats(self, request: Request) -> Response:
        qs = Candidate.objects.filter(election_type=ElectionType.FPTP)

        # --- Overview ---
        overview = qs.aggregate(total_candidates=Count("id"))
        overview["total_parties"] = qs.values("party").distinct().count()
        overview["total_constituencies"] = qs.values("constituency").distinct().count()

        # --- Gender ---
        gender_qs = qs.values("gender").annotate(count=Count("id")).order_by("-count")
        total = overview["total_candidates"]
        gender = [
            {
                "gender": row["gender"],
                "count": row["count"],
                "percentage": round(row["count"] / total * 100, 1) if total else 0,
            }
            for row in gender_qs
        ]

        # --- Age ---
        age_agg = qs.filter(age__isnull=False).aggregate(
            avg_age=Avg("age"),
            min_age=Min("age"),
            max_age=Max("age"),
        )
        age_buckets_qs = (
            qs.filter(age__isnull=False)
            .annotate(
                age_bucket=Case(
                    When(age__lt=30, then=Value("25-29")),
                    When(age__lt=40, then=Value("30-39")),
                    When(age__lt=50, then=Value("40-49")),
                    When(age__lt=60, then=Value("50-59")),
                    When(age__lt=70, then=Value("60-69")),
                    default=Value("70+"),
                )
            )
            .values("age_bucket")
            .annotate(count=Count("id"))
            .order_by("age_bucket")
        )
        bucket_order = ["25-29", "30-39", "40-49", "50-59", "60-69", "70+"]
        bucket_map = {row["age_bucket"]: row["count"] for row in age_buckets_qs}
        age_buckets = [{"bucket": b, "count": bucket_map.get(b, 0)} for b in bucket_order]

        age = {
            "avg_age": round(age_agg["avg_age"], 1) if age_agg["avg_age"] else None,
            "min_age": age_agg["min_age"],
            "max_age": age_agg["max_age"],
            "buckets": age_buckets,
        }

        # --- Party stats (top 15 by candidates fielded) ---
        party_by_candidates = list(
            qs.values("party__id", "party__name_ne", "party__name")
            .annotate(candidate_count=Count("id"))
            .order_by("-candidate_count")[:15]
        )

        # --- Province stats (candidates per province) ---
        province_stats = list(
            qs.filter(constituency__isnull=False)
            .values(
                "constituency__district__province__id",
                "constituency__district__province__name",
                "constituency__district__province__name_ne",
            )
            .annotate(candidate_count=Count("id"))
            .order_by("constituency__district__province__id")
        )
        provinces = [
            {
                "id": row["constituency__district__province__id"],
                "name": row["constituency__district__province__name"],
                "name_ne": row["constituency__district__province__name_ne"],
                "candidate_count": row["candidate_count"],
            }
            for row in province_stats
        ]

        # --- Candidates per constituency (min, max, avg) ---
        const_counts = (
            qs.filter(constituency__isnull=False)
            .values("constituency")
            .annotate(c_count=Count("id"))
        )
        const_agg = const_counts.aggregate(
            avg_per_const=Avg("c_count"),
            min_per_const=Min("c_count"),
            max_per_const=Max("c_count"),
        )
        candidates_per_constituency = {
            "avg": round(const_agg["avg_per_const"], 1) if const_agg["avg_per_const"] else None,
            "min": const_agg["min_per_const"],
            "max": const_agg["max_per_const"],
        }

        data = {
            "overview": overview,
            "gender": gender,
            "age": age,
            "party_by_candidates": party_by_candidates,
            "provinces": provinces,
            "candidates_per_constituency": candidates_per_constituency,
        }

        return Response(data)
