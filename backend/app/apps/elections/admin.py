from django.contrib import admin

from app.apps.elections.models import Constituency, District, Election, Province


@admin.register(Election)
class ElectionAdmin(admin.ModelAdmin):  # type: ignore[type-arg]
    list_display = ["name", "slug", "election_date", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["name", "name_ne"]


@admin.register(Province)
class ProvinceAdmin(admin.ModelAdmin):  # type: ignore[type-arg]
    list_display = ["source_id", "name", "name_ne"]


@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):  # type: ignore[type-arg]
    list_display = ["name_ne", "name", "province"]
    list_filter = ["province"]
    search_fields = ["name", "name_ne"]


@admin.register(Constituency)
class ConstituencyAdmin(admin.ModelAdmin):  # type: ignore[type-arg]
    list_display = ["__str__", "number", "district"]
    list_filter = ["district__province"]
    search_fields = ["district__name_ne"]
