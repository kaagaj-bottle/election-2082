from typing import Any

from django.core.management.base import BaseCommand, CommandParser

from app.apps.candidates.result_fetcher import fetch_live_results


class Command(BaseCommand):
    help = "Fetch live FPTP election results from the Election Commission"

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "--election",
            type=str,
            default="hor-2082",
            help="Election slug (default: hor-2082)",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        election_slug: str = options["election"]
        self.stdout.write(f"Fetching live results for '{election_slug}'...")

        result = fetch_live_results(election_slug)

        if result.success:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Fetch complete:\n"
                    f"  Records fetched: {result.records_fetched}\n"
                    f"  Candidates updated: {result.candidates_updated}\n"
                    f"  Duration: {result.duration_seconds:.1f}s"
                )
            )
        else:
            self.stdout.write(
                self.style.ERROR(
                    f"Fetch failed:\n"
                    f"  Error: {result.error_message}\n"
                    f"  Duration: {result.duration_seconds:.1f}s"
                )
            )
