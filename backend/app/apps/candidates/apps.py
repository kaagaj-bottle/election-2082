import os
import sys

from django.apps import AppConfig


class CandidatesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "app.apps.candidates"

    def ready(self) -> None:
        # Only start the scheduler in the actual server process
        is_runserver = "runserver" in sys.argv
        is_run_main = os.environ.get("RUN_MAIN") == "true"
        is_gunicorn = "gunicorn" in sys.modules

        if (is_runserver and is_run_main) or is_gunicorn:
            from app.apps.candidates.scheduler import start_result_scheduler

            start_result_scheduler()
