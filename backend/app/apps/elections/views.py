from __future__ import annotations

from rest_framework.viewsets import ReadOnlyModelViewSet

from app.apps.elections.models import Constituency, District, Election, Province
from app.apps.elections.serializers import (
    ConstituencySerializer,
    DistrictDetailSerializer,
    DistrictSerializer,
    ElectionDetailSerializer,
    ElectionListSerializer,
    ProvinceDetailSerializer,
    ProvinceSerializer,
)


class ElectionViewSet(ReadOnlyModelViewSet[Election]):
    queryset = Election.objects.all()

    def get_serializer_class(self) -> type[ElectionListSerializer | ElectionDetailSerializer]:
        if self.action == "retrieve":
            return ElectionDetailSerializer
        return ElectionListSerializer


class ProvinceViewSet(ReadOnlyModelViewSet[Province]):
    queryset = Province.objects.all()

    def get_serializer_class(self) -> type[ProvinceSerializer | ProvinceDetailSerializer]:
        if self.action == "retrieve":
            return ProvinceDetailSerializer
        return ProvinceSerializer


class DistrictViewSet(ReadOnlyModelViewSet[District]):
    queryset = District.objects.select_related("province").all()

    def get_serializer_class(self) -> type[DistrictSerializer | DistrictDetailSerializer]:
        if self.action == "retrieve":
            return DistrictDetailSerializer
        return DistrictSerializer


class ConstituencyViewSet(ReadOnlyModelViewSet[Constituency]):
    serializer_class = ConstituencySerializer
    queryset = Constituency.objects.select_related("district__province").all()
