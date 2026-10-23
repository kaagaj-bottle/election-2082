# Nepal Election 2082

Bilingual (Nepali/English) web application for browsing Nepal's House of Representatives Election 2082 candidate data. Browse 3,406 FPTP candidates across 165 constituencies and 66 parties.

**Election date**: 21 Falgun 2082 / March 5, 2026

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, TailwindCSS, React Router v7 |
| Backend | Django 5.1, Django REST Framework, drf-spectacular |
| Database | PostgreSQL 16 with pg_trgm for trigram search |
| Deployment | Docker Compose, Nginx (VPS) |

## Features

- Search candidates by name in Nepali or English
- Filter by party, constituency, district, province, gender, age range
- Browse geography: Province > District > Constituency
- Bilingual API responses (`?lang=ne` or `?lang=en`)
- Cursor-based pagination for consistent results
- Dark/light mode
- Interactive Swagger API docs at `/api/docs/`
- Candidate photos from the Election Commission

## Project Structure

```
election-2082/
├── backend/                 # Django REST API
│   ├── app/
│   │   ├── settings/        # base / dev / prod
│   │   ├── core/            # Pagination, bilingual mixin, transliteration
│   │   └── apps/
│   │       ├── elections/   # Election, Province, District, Constituency
│   │       ├── parties/     # Party
│   │       └── candidates/  # Candidate, filters, import service
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/                # React SPA
│   ├── src/
│   │   ├── components/      # UI, layout, shared
│   │   ├── features/        # candidates, parties, home, geography
│   │   ├── hooks/           # useApi, useCursorPagination, useFilters
│   │   ├── contexts/        # Theme, Language
│   │   └── types/           # API types
│   └── package.json
├── nginx/                   # Nginx proxy config for VPS
├── docker-compose.yml
├── .env.example
└── election_result_2082.json  # Source data (3,406 candidates)
```

## Getting Started

### Prerequisites

- [uv](https://docs.astral.sh/uv/) (Python package manager)
- [Node.js](https://nodejs.org/) 18+
- PostgreSQL 14+

### Backend

```bash
cd backend

# Install dependencies
uv sync

# Create the database
PGPASSWORD=postgres psql -U postgres -h localhost -c "CREATE DATABASE election_2082;"

# Run migrations
uv run python manage.py migrate

# Load the bundled election dataset (fixtures/election_data.json.gz)
uv run python manage.py seed_data

# Start the dev server
uv run python manage.py runserver
```

The API is available at `http://localhost:8000`. Swagger docs at `http://localhost:8000/api/docs/`.

### Frontend

```bash
cd frontend

npm install
npm run dev
```

The app is available at `http://localhost:5173` (Vite proxies API requests to the backend).

### Docker

```bash
cp .env.example .env
# Edit .env with your values

docker-compose up
```

This starts PostgreSQL and the Django backend. The backend runs migrations automatically on startup.

## API Endpoints

| Endpoint | Description |
|----------|-------------|
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
| `GET /api/schema/` | OpenAPI schema |
| `GET /api/docs/` | Swagger UI |

### Candidate Filters

Query parameters on `/api/v1/candidates/`:

| Parameter | Example | Description |
|-----------|---------|-------------|
| `election_type` | `fptp` | FPTP or PR |
| `party` | `1` | Party ID |
| `constituency` | `5` | Constituency ID |
| `district` | `10` | District ID |
| `province` | `3` | Province ID |
| `gender` | `female` | male, female, other |
| `age_min` | `25` | Minimum age |
| `age_max` | `60` | Maximum age |
| `search` | `कृष्ण` | Search name (Nepali or English) |
| `lang` | `ne` | Response language (ne or en) |
| `page_size` | `20` | Results per page (max 200, default 50) |

## Development

```bash
# Backend linting & type checking
cd backend
uv run ruff check . && uv run ruff format .
uv run pyright

# Frontend linting & formatting
cd frontend
npm run lint
npm run format
```

## Data Source

FPTP candidate data is sourced from the [Nepal Election Commission](https://result.election.gov.np) official JSON feed. Candidate photos are served from `result.election.gov.np/Images/Candidate/{id}.jpg`. See [CANDIDATE_DATA_SOURCES.md](CANDIDATE_DATA_SOURCES.md) for the full data sourcing documentation.

## Deployment

**Backend**: Deploy with Docker on a VPS. Copy `.env.example` to `.env`, configure your values, and run `docker-compose up -d`. Use the provided `nginx/election-api.conf` to proxy `/api/` to the backend container.

On start, the container runs migrations and then `seed_data`, which loads `backend/fixtures/election_data.json.gz` (final results, PR votes, English data) into an empty database. It is a no-op if data already exists; use `python manage.py seed_data --force` to reload.

## License

This project is for educational and civic information purposes. Election data is publicly available from the Nepal Election Commission.
