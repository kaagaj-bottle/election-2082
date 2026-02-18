from typing import Any

from django.core.management.base import BaseCommand, CommandParser

from app.apps.candidates.services import import_fptp_from_json


class Command(BaseCommand):
    help = "Import FPTP candidates from the Election Commission JSON file"

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("file", type=str, help="Path to the JSON file")
        parser.add_argument(
            "--election",
            type=str,
            required=True,
            help="Election slug (e.g., hor-2082)",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        file_path: str = options["file"]
        election_slug: str = options["election"]

        self.stdout.write(f"Importing FPTP candidates from {file_path}...")

        result = import_fptp_from_json(file_path, election_slug)

        if result.election_created:
            self.stdout.write(f"  Created election '{election_slug}'")

        self.stdout.write(
            self.style.SUCCESS(
                f"Import complete:\n"
                f"  Provinces: {result.provinces}\n"
                f"  Districts: {result.districts}\n"
                f"  Constituencies: {result.constituencies}\n"
                f"  Parties: {result.parties}\n"
                f"  Candidates created: {result.candidates_created}\n"
                f"  Candidates updated: {result.candidates_updated}"
            )
        )
