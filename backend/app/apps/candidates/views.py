from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

from django.conf import settings
from django.db.models import (
    Avg,
    Case,
    Count,
    Max,
    Min,
    QuerySet,
    Sum,
    Value,
    When,
)
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.viewsets import ReadOnlyModelViewSet

from app.apps.candidates.filters import CandidateFilterSet
from app.apps.candidates.models import Candidate, ElectionType, ResultFetchLog
from app.apps.candidates.serializers import CandidateDetailSerializer, CandidateListSerializer
from app.apps.elections.serializers import ConstituencySerializer


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

    # --- Live Result Endpoints ---

    @action(
        detail=False,
        methods=["get"],
        url_path="results/constituency/(?P<constituency_id>[0-9]+)",
    )
    def results_constituency(self, request: Request, constituency_id: str = "") -> Response:
        """Candidates in a constituency sorted by votes desc (no pagination)."""
        candidates = (
            Candidate.objects.filter(
                election_type=ElectionType.FPTP,
                constituency_id=int(constituency_id),
            )
            .select_related("party", "constituency__district__province")
            .order_by("-votes_received", "id")
        )
        serializer = CandidateListSerializer(candidates, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="results/party-tally", pagination_class=None)
    def results_party_tally(self, request: Request) -> Response:
        """Party seat count + total votes.
        A 'seat won' = candidate with max votes in their constituency (where votes > 0).
        """
        qs = Candidate.objects.filter(election_type=ElectionType.FPTP)

        # Find winner of each constituency by iterating ordered candidates
        constituency_winners: dict[int, list[int]] = {}
        const_candidates = (
            qs.filter(votes_received__gt=0)
            .values("constituency_id", "party_id", "votes_received")
            .order_by("constituency_id", "-votes_received")
        )
        current_const = None
        max_votes_in_const = 0
        for row in const_candidates:
            cid = row["constituency_id"]
            if cid != current_const:
                current_const = cid
                max_votes_in_const = row["votes_received"]
                constituency_winners[cid] = [row["party_id"]]
            elif row["votes_received"] == max_votes_in_const:
                constituency_winners[cid].append(row["party_id"])

        # Count seats per party (ties = no seat awarded)
        seats_won: dict[int, int] = defaultdict(int)
        for winners_list in constituency_winners.values():
            if len(winners_list) == 1:
                seats_won[winners_list[0]] += 1

        # Get party totals via aggregation
        party_rows = list(
            qs.values("party_id", "party__name_ne", "party__name")
            .annotate(
                total_votes=Sum("votes_received"),
                candidate_count=Count("id"),
            )
            .order_by("-total_votes")
        )

        result = []
        for row in party_rows:
            pid = row["party_id"]
            result.append(
                {
                    "party_id": pid,
                    "party_name_ne": row["party__name_ne"],
                    "party_name": row["party__name"],
                    "seats_won": seats_won.get(pid, 0),
                    "total_votes": row["total_votes"],
                    "candidate_count": row["candidate_count"],
                }
            )

        result.sort(key=lambda r: (-r["seats_won"], -r["total_votes"]))  # type: ignore[reportUnknownLambdaType]
        return Response(result)

    @action(
        detail=False,
        methods=["get"],
        url_path="results/province-summary",
        pagination_class=None,
    )
    def results_province_summary(self, request: Request) -> Response:
        """Per-province vote totals and constituency counts."""
        qs = Candidate.objects.filter(
            election_type=ElectionType.FPTP,
            constituency__isnull=False,
        )
        province_data = list(
            qs.values(
                "constituency__district__province__id",
                "constituency__district__province__name",
                "constituency__district__province__name_ne",
            )
            .annotate(
                total_votes=Sum("votes_received"),
                total_candidates=Count("id"),
                total_constituencies=Count("constituency_id", distinct=True),
            )
            .order_by("constituency__district__province__id")
        )

        result = [
            {
                "province_id": row["constituency__district__province__id"],
                "province_name": row["constituency__district__province__name"],
                "province_name_ne": row["constituency__district__province__name_ne"],
                "total_votes": row["total_votes"],
                "total_candidates": row["total_candidates"],
                "total_constituencies": row["total_constituencies"],
            }
            for row in province_data
        ]
        return Response(result)

    @action(detail=False, methods=["get"], url_path="results/last-updated", pagination_class=None)
    def results_last_updated(self, request: Request) -> Response:
        """Last successful fetch timestamp from ResultFetchLog."""
        last_log = ResultFetchLog.objects.filter(success=True).first()
        if last_log:
            return Response(
                {
                    "last_updated": last_log.fetched_at.isoformat(),
                    "records_fetched": last_log.records_fetched,
                    "candidates_updated": last_log.candidates_updated,
                }
            )
        return Response(
            {
                "last_updated": None,
                "records_fetched": 0,
                "candidates_updated": 0,
            }
        )

    @action(detail=False, methods=["get"], url_path="results/hotseats", pagination_class=None)
    def results_hotseats(self, request: Request) -> Response:
        """Return full constituency results for featured candidates."""
        config_path: Path = settings.BASE_DIR / "hotseats.json"
        if not config_path.exists():
            return Response([])

        names: list[str] = json.loads(config_path.read_text(encoding="utf-8"))

        # Find the featured candidates
        featured = (
            Candidate.objects.filter(election_type=ElectionType.FPTP, name__in=names)
            .select_related("constituency__district__province")
            .only("id", "name", "constituency_id")
        )

        # Build result per constituency
        result = []
        seen_constituencies: set[int] = set()
        for candidate in featured:
            cid = candidate.constituency_id
            if cid is None or cid in seen_constituencies:
                continue
            seen_constituencies.add(cid)

            candidates_qs = (
                Candidate.objects.filter(
                    election_type=ElectionType.FPTP,
                    constituency_id=cid,
                )
                .select_related("party", "constituency__district__province")
                .order_by("-votes_received", "id")
            )
            serializer = CandidateListSerializer(
                candidates_qs, many=True, context={"request": request}
            )
            result.append(
                {
                    "candidate_name": candidate.name,
                    "constituency": ConstituencySerializer(
                        candidate.constituency, context={"request": request}
                    ).data,
                    "candidates": serializer.data,
                }
            )

        return Response(result)
