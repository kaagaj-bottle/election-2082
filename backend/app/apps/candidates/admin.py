from django.contrib import admin

from app.apps.candidates.models import Candidate, ResultFetchLog


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):  # type: ignore[type-arg]
    list_display = ["name_ne", "name", "election_type", "party", "constituency", "votes_received"]
    list_filter = ["election_type", "gender", "election"]
    search_fields = ["name_ne", "name", "father_name_en"]
    raw_id_fields = ["party", "constituency", "election"]


@admin.register(ResultFetchLog)
class ResultFetchLogAdmin(admin.ModelAdmin):  # type: ignore[type-arg]
    list_display = [
        "fetched_at",
        "success",
        "records_fetched",
        "candidates_updated",
        "duration_seconds",
    ]
    list_filter = ["success"]
    readonly_fields = [
        "fetched_at",
        "success",
        "source_url",
        "records_fetched",
        "candidates_updated",
        "error_message",
        "duration_seconds",
    ]
