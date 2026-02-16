from django.contrib import admin

from app.apps.candidates.models import Candidate


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):  # type: ignore[type-arg]
    list_display = ["name_ne", "name", "election_type", "party", "constituency", "votes_received"]
    list_filter = ["election_type", "gender", "election"]
    search_fields = ["name_ne", "name", "father_name_en"]
    raw_id_fields = ["party", "constituency", "election"]
