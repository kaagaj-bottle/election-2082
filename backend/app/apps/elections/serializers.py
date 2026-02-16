from __future__ import annotations

from rest_framework import serializers

from app.apps.elections.models import Constituency, District, Election, Province
from app.core.bilingual import BilingualMixin

_NAME_BILINGUAL = {
    "name": {"ne": "name_ne", "en": "name"},
}


class ElectionListSerializer(BilingualMixin, serializers.ModelSerializer[Election]):
    bilingual_field_map = _NAME_BILINGUAL

    class Meta:
        model = Election
        fields = ["id", "name", "name_ne", "slug", "election_date", "is_active"]


class ElectionDetailSerializer(BilingualMixin, serializers.ModelSerializer[Election]):
    bilingual_field_map = _NAME_BILINGUAL

    class Meta:
        model = Election
        fields = [
            "id",
            "name",
            "name_ne",
            "slug",
            "election_date",
            "total_seats_fptp",
            "total_seats_pr",
            "is_active",
            "created_at",
        ]


class ProvinceSerializer(BilingualMixin, serializers.ModelSerializer[Province]):
    bilingual_field_map = _NAME_BILINGUAL

    class Meta:
        model = Province
        fields = ["id", "source_id", "name", "name_ne"]


class DistrictMinimalSerializer(BilingualMixin, serializers.ModelSerializer[District]):
    bilingual_field_map = _NAME_BILINGUAL

    class Meta:
        model = District
        fields = ["id", "name", "name_ne"]


class ProvinceDetailSerializer(BilingualMixin, serializers.ModelSerializer[Province]):
    districts = DistrictMinimalSerializer(many=True, read_only=True)
    bilingual_field_map = _NAME_BILINGUAL

    class Meta:
        model = Province
        fields = ["id", "source_id", "name", "name_ne", "districts"]


class DistrictSerializer(BilingualMixin, serializers.ModelSerializer[District]):
    province = ProvinceSerializer(read_only=True)
    bilingual_field_map = _NAME_BILINGUAL

    class Meta:
        model = District
        fields = ["id", "name", "name_ne", "province"]


class ConstituencyMinimalSerializer(serializers.ModelSerializer[Constituency]):
    class Meta:
        model = Constituency
        fields = ["id", "number"]


class DistrictDetailSerializer(BilingualMixin, serializers.ModelSerializer[District]):
    province = ProvinceSerializer(read_only=True)
    constituencies = ConstituencyMinimalSerializer(many=True, read_only=True)
    bilingual_field_map = _NAME_BILINGUAL

    class Meta:
        model = District
        fields = ["id", "name", "name_ne", "province", "constituencies"]


class ConstituencySerializer(serializers.ModelSerializer[Constituency]):
    district = DistrictSerializer(read_only=True)

    class Meta:
        model = Constituency
        fields = ["id", "number", "district"]
