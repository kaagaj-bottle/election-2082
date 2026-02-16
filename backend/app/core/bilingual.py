"""Bilingual API support mixin for serializers."""

from __future__ import annotations

from typing import Any, ClassVar

from rest_framework.serializers import Serializer


class BilingualMixin:
    """Serializer mixin that supports ``?lang=en`` or ``?lang=ne`` query parameter.

    When ``?lang=`` is absent, all fields are returned as-is (backward compatible).
    When ``?lang=en``, bilingual pairs collapse to canonical name with English value.
    When ``?lang=ne``, bilingual pairs collapse to canonical name with Nepali value.

    Each serializer declares a ``bilingual_field_map``::

        bilingual_field_map = {
            "name": {"ne": "name_ne", "en": "name"},
            "father_name": {"ne": "father_name", "en": "father_name_en"},
        }
    """

    bilingual_field_map: ClassVar[dict[str, dict[str, str]]]

    def to_representation(self, instance: Any) -> dict[str, Any]:
        data: dict[str, Any] = super().to_representation(instance)  # type: ignore[misc]

        request = self.context.get("request")  # type: ignore[attr-defined]
        if not request:
            return data

        lang = request.query_params.get("lang")
        if lang not in ("en", "ne"):
            return data

        field_map = getattr(self, "bilingual_field_map", {})
        if not field_map:
            return data

        new_data: dict[str, Any] = {}
        # Collect all source field names that should be removed
        mapped_sources: set[str] = set()
        for _canonical, lang_map in field_map.items():
            for source in lang_map.values():
                mapped_sources.add(source)

        for key, value in data.items():
            if key in mapped_sources:
                continue
            new_data[key] = value

        for canonical, lang_map in field_map.items():
            source_field = lang_map.get(lang)
            if source_field and source_field in data:
                new_data[canonical] = data[source_field]

        return new_data


def get_lang_from_context(serializer: Serializer) -> str | None:  # type: ignore[type-arg]
    """Extract the lang parameter from serializer context."""
    request = serializer.context.get("request")
    if not request:
        return None
    lang = request.query_params.get("lang")
    if lang in ("en", "ne"):
        return lang
    return None
