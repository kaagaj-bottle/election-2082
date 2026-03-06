from typing import Any

from django.core.management.base import BaseCommand

from app.apps.candidates.pr_result_fetcher import fetch_pr_results


class Command(BaseCommand):
    help = "Fetch PR (proportional representation) party vote results from the Election Commission"

    def handle(self, *args: Any, **options: Any) -> None:
        self.stdout.write("Fetching PR party vote results...")

        result = fetch_pr_results()

        if result.success:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Fetch complete:\n"
                    f"  Records fetched: {result.records_fetched}\n"
                    f"  Parties updated: {result.parties_updated}\n"
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
