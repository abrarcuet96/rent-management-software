# RentFlow

A multi-tenant Rent Management SaaS built with FastAPI, PostgreSQL, and React.

## Tech Stack

**Backend:** Python, FastAPI, SQLAlchemy (async), Alembic, PostgreSQL
**Frontend:** React, TypeScript, Shadcn UI, Tailwind CSS, TanStack Query
**Infrastructure:** Docker, Docker Compose

## Quick Start

### With Docker (recommended)

```bash
just docker-up
```

API runs at http://localhost:8000
Docs at http://localhost:8000/docs

### Local Development

```bash
just venv
just deps
just db-create
just run
```

## Development Commands

```bash
just run              # Start dev server
just test             # Run all tests
just check            # Format + lint
just docker-up        # Start with Docker
just docker-down      # Stop Docker services
just migrate          # Run database migrations
just migration name   # Create new migration
```

## Project Structure

```
rentflow/
├── backend/          # FastAPI application
│   ├── app/
│   │   ├── auth/           # Authentication
│   │   ├── buildings/      # Building management
│   │   ├── apartments/     # Apartment management
│   │   ├── tenants/        # Tenant management
│   │   ├── agreements/     # Rent agreements
│   │   ├── dues/           # Monthly dues
│   │   ├── payments/       # Payment recording
│   │   ├── expenses/       # Expense tracking
│   │   ├── dashboard/      # Dashboard summary
│   │   ├── reports/        # Reports and analytics
│   │   ├── core/           # Config, security, database
│   │   ├── models/         # SQLAlchemy models
│   │   └── shared/         # Shared utilities
│   └── tests/              # Integration tests (88 tests)
├── database/         # SQL schema and seeds
├── docs/             # OpenAPI specification
└── justfile          # Development commands
```

## API Documentation

OpenAPI spec: `docs/openapi.yaml`
Swagger UI: http://localhost:8000/docs (when running)

## Testing

```bash
just test             # All 88 tests
just test-unit        # Unit tests only
just test-integration # Integration tests only
just test-coverage    # With coverage report
```
