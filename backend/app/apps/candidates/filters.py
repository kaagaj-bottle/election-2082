from django.db.models import Q, QuerySet
from django_filters import CharFilter, ChoiceFilter, FilterSet, NumberFilter

from app.apps.candidates.models import Candidate, ElectionType, Gender


class CandidateFilterSet(FilterSet):  # type: ignore[type-arg]
    election = NumberFilter(field_name="election_id")
    election_type = ChoiceFilter(choices=ElectionType.choices)
    party = NumberFilter(field_name="party_id")
    constituency = NumberFilter(field_name="constituency_id")
    district = NumberFilter(field_name="constituency__district_id")
    province = NumberFilter(field_name="constituency__district__province_id")
    gender = ChoiceFilter(choices=Gender.choices)
    age_min = NumberFilter(field_name="age", lookup_expr="gte")
    age_max = NumberFilter(field_name="age", lookup_expr="lte")
    search = CharFilter(method="filter_search")

    class Meta:
        model = Candidate
        fields: list[str] = []

    def filter_search(
        self, queryset: QuerySet[Candidate], name: str, value: str
    ) -> QuerySet[Candidate]:
        return queryset.filter(Q(name_ne__icontains=value) | Q(name__icontains=value))
