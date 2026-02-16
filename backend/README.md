# Nepal Election 2082 Backend

REST API serving candidate data for Nepal's House of Representatives Election 2082.

## Prerequisites

- [uv](https://docs.astral.sh/uv/) (Python package manager)
- PostgreSQL 14+

## Setup

```bash
cd backend

# Install dependencies
uv sync

# Create the database
PGPASSWORD=postgres psql -U postgres -h localhost -c "CREATE DATABASE election_2082;"

# Run migrations
uv run python manage.py migrate

# Create the election record
uv run python manage.py shell -c "
from app.apps.elections.models import Election
from datetime import date
Election.objects.get_or_create(
    slug='hor-2082',
    defaults={
        'name': 'House of Representatives Election 2082',
        'name_ne': 'प्रतिनिधि सभा निर्वाचन २०८२',
        'election_date': date(2026, 3, 5),
        'total_seats_fptp': 165,
        'total_seats_pr': 110,
        'is_active': True,
    }
)
"

# Import FPTP candidate data
uv run python manage.py import_fptp ../election_result_2082.json --election hor-2082
```

## Run the Server

```bash
uv run python manage.py runserver
```

The API is available at `http://localhost:8000`.

## API Documentation (Swagger)

Open `http://localhost:8000/api/docs/` in your browser to view the interactive Swagger UI.

The raw OpenAPI schema is at `http://localhost:8000/api/schema/`.

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/v1/elections/` | List elections |
| `GET /api/v1/elections/{id}/` | Election detail |
| `GET /api/v1/provinces/` | List provinces |
| `GET /api/v1/provinces/{id}/` | Province with districts |
| `GET /api/v1/districts/` | List districts |
| `GET /api/v1/districts/{id}/` | District with constituencies |
| `GET /api/v1/constituencies/` | List constituencies |
| `GET /api/v1/candidates/` | List candidates (filterable) |
| `GET /api/v1/candidates/{id}/` | Candidate detail |
| `GET /api/v1/parties/` | List parties |
| `GET /api/v1/parties/{id}/` | Party detail with candidate count |

### Candidate Filters

All filters are query parameters on `/api/v1/candidates/`:

| Parameter | Example | Description |
|---|---|---|
| `election_type` | `fptp` or `pr` | Filter by election type |
| `party` | `1` | Filter by party ID |
| `constituency` | `5` | Filter by constituency ID |
| `district` | `10` | Filter by district ID |
| `province` | `3` | Filter by province ID |
| `gender` | `male`, `female`, `other` | Filter by gender |
| `age_min` | `25` | Minimum age |
| `age_max` | `60` | Maximum age |
| `search` | `कृष्ण` | Search by name (Nepali or English) |
| `page_size` | `20` | Results per page (max 200, default 50) |

## Architecture

```
backend/
├── app/
│   ├── settings/          # base / dev / prod settings
│   ├── core/              # Shared utilities (pagination)
│   ├── apps/
│   │   ├── elections/     # Election, Province, District, Constituency models
│   │   ├── parties/       # Party model
│   │   └── candidates/    # Candidate model, filters, import service
│   ├── urls.py            # Root URL routing
│   ├── wsgi.py
│   └── asgi.py
├── manage.py
└── pyproject.toml
```

- **Django REST Framework** for the API layer
- **PostgreSQL** as the database with GIN trigram indexes for name search
- **Cursor pagination** for consistent, offset-free pagination
- **drf-spectacular** for OpenAPI schema and Swagger UI
- **django-filter** for query parameter filtering

Each app follows the pattern: `models.py` → `serializers.py` → `views.py` → `urls.py`. Business logic (data import) lives in `candidates/services.py`, keeping views thin.

## Linting & Type Checking

```bash
uv run ruff check .          # lint
uv run ruff format .         # format
uv run pyright               # type check (strict mode)
```
