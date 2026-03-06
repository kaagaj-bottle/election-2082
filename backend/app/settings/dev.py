from app.settings.base import *  # noqa: F403

DEBUG = True

ALLOWED_HOSTS: list[str] = ["*"]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "election_2082",
        "USER": "postgres",
        "PASSWORD": "postgres",
        "HOST": "localhost",
        "PORT": "5432",
    }
}

CORS_ALLOW_ALL_ORIGINS = True

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {"class": "logging.StreamHandler"},
    },
    "loggers": {
        "app.apps.candidates": {
            "handlers": ["console"],
            "level": "INFO",
        },
    },
}
