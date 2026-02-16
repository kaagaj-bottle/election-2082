from django.contrib import admin

from app.apps.parties.models import Party


@admin.register(Party)
class PartyAdmin(admin.ModelAdmin):  # type: ignore[type-arg]
    list_display = ["name_ne", "name"]
    search_fields = ["name_ne", "name"]
