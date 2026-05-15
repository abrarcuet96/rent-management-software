# RentFlow — command runner

set dotenv-load := true
set export

# ── paths ────────────────────────────────────────────────────────────────────
VENV     := ".venv"
PYTHON   := VENV + "/bin/python"
PIP      := VENV + "/bin/pip"
UVICORN  := VENV + "/bin/uvicorn"
PYTEST   := VENV + "/bin/pytest"
ALEMBIC  := VENV + "/bin/alembic"
RUFF     := VENV + "/bin/ruff"

# ── database ──────────────────────────────────────────────────────────────────
DB_USER := "postgres"
DB_PASS := "postgres"
DB_HOST := "localhost"
DB_PORT := "5432"
DB_NAME := "rentflow_dev"
DB_TEST := "rentflow_test"

# ── default ───────────────────────────────────────────────────────────────────
default:
    @just --list

# ── environment ───────────────────────────────────────────────────────────────
venv:
    python3 -m venv {{VENV}}
    {{PIP}} install --upgrade pip
    @echo "✓ Virtual environment created — activate with: source .venv/bin/activate"

deps:
    {{PIP}} install -r backend/requirements.txt

deps-dev:
    {{PIP}} install -r backend/requirements.txt -r backend/requirements-dev.txt

# ── dev server ────────────────────────────────────────────────────────────────
run:
    {{UVICORN}} main:app --app-dir backend --reload --host 0.0.0.0 --port 8000

dev: run

# ── database ──────────────────────────────────────────────────────────────────
db-create:
    createdb -U {{DB_USER}} -h {{DB_HOST}} -p {{DB_PORT}} {{DB_NAME}}
    @echo "✓ Created database {{DB_NAME}}"

db-create-test:
    createdb -U {{DB_USER}} -h {{DB_HOST}} -p {{DB_PORT}} {{DB_TEST}}
    @echo "✓ Created test database {{DB_TEST}}"

db-drop:
    psql -U {{DB_USER}} -h {{DB_HOST}} -p {{DB_PORT}} -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '{{DB_NAME}}' AND pid <> pg_backend_pid();" 2>/dev/null || true
    dropdb --if-exists -U {{DB_USER}} -h {{DB_HOST}} -p {{DB_PORT}} {{DB_NAME}}
    @echo "✓ Dropped database {{DB_NAME}}"

db-drop-test:
    psql -U {{DB_USER}} -h {{DB_HOST}} -p {{DB_PORT}} -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '{{DB_TEST}}' AND pid <> pg_backend_pid();" 2>/dev/null || true
    dropdb --if-exists -U {{DB_USER}} -h {{DB_HOST}} -p {{DB_PORT}} {{DB_TEST}}
    @echo "✓ Dropped test database {{DB_TEST}}"

db-reset: db-drop db-create schema-apply seed
    @echo "✓ Database reset"

db-reset-test: db-drop-test db-create-test
    @echo "✓ Test database reset"

# ── migrations ────────────────────────────────────────────────────────────────
schema-apply:
    psql -U {{DB_USER}} -h {{DB_HOST}} -p {{DB_PORT}} -d {{DB_NAME}} -f database/schema.sql
    @echo "✓ Schema applied"

seed:
    psql -U {{DB_USER}} -h {{DB_HOST}} -p {{DB_PORT}} -d {{DB_NAME}} -f database/seeds/seed.sql
    @echo "✓ Seed data applied"

migrate: schema-apply

# ── tests ─────────────────────────────────────────────────────────────────────
test:
    {{PYTEST}} backend/tests -v

test-unit:
    {{PYTEST}} backend/tests/unit -v

test-integration:
    {{PYTEST}} backend/tests/integration -v

test-coverage:
    {{PYTEST}} backend/tests --cov=backend/app --cov-report=term-missing --cov-report=html

test-file file:
    {{PYTEST}} {{file}} -v

test-k keyword:
    {{PYTEST}} backend/tests -v -k "{{keyword}}"

# ── linting / formatting ──────────────────────────────────────────────────────
format:
    {{RUFF}} format backend

lint:
    {{RUFF}} check backend

lint-fix:
    {{RUFF}} check backend --fix

check: lint
    {{RUFF}} format backend --check

# ── pre-commit ────────────────────────────────────────────────────────────────
pre-commit-install:
    {{VENV}}/bin/pre-commit install
    @echo "✓ pre-commit hooks installed"

pre-commit:
    {{VENV}}/bin/pre-commit run --all-files

# ── git ───────────────────────────────────────────────────────────────────────
git-init:
    git init
    cp backend/.env.example backend/.env 2>/dev/null || true
    @echo "✓ Git repository initialised"

# ── docker ───────────────────────────────────────────────────────────────────
docker-up:
    docker compose up -d
    @echo "✓ Services started (http://localhost:8000)"

docker-down:
    docker compose down

docker-clean:
    docker compose down -v --remove-orphans
    @echo "✓ Containers and volumes removed"

docker-logs:
    docker compose logs -f api

docker-test:
    docker compose -f docker-compose.test.yml up --build --abort-on-container-exit --exit-code-from test
    docker compose -f docker-compose.test.yml down -v

docker-rebuild:
    docker compose build --no-cache api
    docker compose up -d api

# ── frontend ─────────────────────────────────────────────────────────────────
frontend-dev:
    cd frontend && npm run dev

frontend-build:
    cd frontend && npm run build

frontend-deps:
    cd frontend && npm install

frontend-check:
    cd frontend && npx tsc --noEmit

# ── all-in-one ────────────────────────────────────────────────────────────────
setup: venv deps-dev db-create migrate pre-commit-install
    @echo "✓ Project ready"

check-all: check frontend-check
    @echo "✓ All checks passed"

ready: check test
    @echo "✓ Ready to commit"
