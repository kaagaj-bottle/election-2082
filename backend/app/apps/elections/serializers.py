from __future__ import annotations

from rest_framework import serializers

from app.apps.elections.models import Constituency, District, Election, Province


class ElectionListSerializer(serializers.ModelSerializer[Election]):
    class Meta:
        model = Election
        fields = ["id", "name", "name_ne", "slug", "election_date", "is_active"]


class ElectionDetailSerializer(serializers.ModelSerializer[Election]):
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


class ProvinceSerializer(serializers.ModelSerializer[Province]):
    class Meta:
        model = Province
        fields = ["id", "source_id", "name", "name_ne"]


class DistrictMinimalSerializer(serializers.ModelSerializer[District]):
    class Meta:
        model = District
        fields = ["id", "name", "name_ne"]


class ProvinceDetailSerializer(serializers.ModelSerializer[Province]):
    districts = DistrictMinimalSerializer(many=True, read_only=True)

    class Meta:
        model = Province
        fields = ["id", "source_id", "name", "name_ne", "districts"]


class DistrictSerializer(serializers.ModelSerializer[District]):
    province = ProvinceSerializer(read_only=True)

    class Meta:
        model = District
        fields = ["id", "name", "name_ne", "province"]


class ConstituencyMinimalSerializer(serializers.ModelSerializer[Constituency]):
    class Meta:
        model = Constituency
        fields = ["id", "number"]


class DistrictDetailSerializer(serializers.ModelSerializer[District]):
    province = ProvinceSerializer(read_only=True)
    constituencies = ConstituencyMinimalSerializer(many=True, read_only=True)

    class Meta:
        model = District
        fields = ["id", "name", "name_ne", "province", "constituencies"]


class ConstituencySerializer(serializers.ModelSerializer[Constituency]):
    district = DistrictSerializer(read_only=True)

    class Meta:
        model = Constituency
        fields = ["id", "number", "district"]
