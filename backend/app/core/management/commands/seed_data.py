from pathlib import Path
from typing import Any

from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandParser

from app.apps.elections.models import Election

DEFAULT_FIXTURE = Path(__file__).resolve().parents[4] / "fixtures" / "election_data.json.gz"


class Command(BaseCommand):
    help = "Load the bundled election dataset into an empty database (no-op if data exists)"

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("--file", type=Path, default=DEFAULT_FIXTURE)
        parser.add_argument("--force", action="store_true", help="Load even if data exists")

    def handle(self, *args: Any, **options: Any) -> None:
        if Election.objects.exists() and not options["force"]:
            self.stdout.write("Election data already present — skipping seed.")
            return
        call_command("loaddata", str(options["file"]), verbosity=0)
        self.stdout.write(self.style.SUCCESS(f"Loaded {options['file'].name}"))
