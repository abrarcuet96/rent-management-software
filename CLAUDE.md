# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Before implementing anything in this project, always:

- Scan the relevant existing code first
- Find the closest similar feature already implemented
- Follow the exact same pattern, structure, and conventions
- Reuse existing components, hooks, utils, and types
- No new libraries, no new patterns, no redundant code

**Keeping this file current:** Whenever a new pattern, library, component, hook, or convention is introduced to the project, update CLAUDE.md immediately to reflect it. This file must always match what the codebase actually does.

## Project

RentFlow is a multi-tenant Rent Management SaaS backed by PostgreSQL. Payments are recorded manually by owners — there is no payment gateway.

## Stack

- **Backend:** Python 3.12, FastAPI 0.136, SQLAlchemy 2.0 (async), asyncpg, Alembic, PostgreSQL
- **Frontend:** React 19, TypeScript 6, Vite 8, React Router 7, TanStack Query, Axios, Zustand, shadcn/ui, Tailwind CSS, React Hook Form, Zod
- **Testing (backend):** pytest + pytest-asyncio + httpx AsyncClient against real test DB
- **Testing (frontend):** Vitest + React Testing Library + MSW; Playwright for E2E
- **Tooling:** `just` task runner, Ruff (lint + format), pre-commit hooks, Docker Compose

## Repository layout

```
rentflow/
├── backend/
│   ├── app/
│   │   ├── agreements/        # routes, service, schemas
│   │   ├── apartments/        # routes, service, schemas
│   │   ├── auth/              # routes, service, schemas
│   │   ├── buildings/         # routes, service, schemas
│   │   ├── core/              # config, database session, security (JWT)
│   │   ├── dashboard/         # routes, service
│   │   ├── dues/              # routes, service, schemas
│   │   ├── expenses/          # routes, service, schemas
│   │   ├── middleware/        # error_handler
│   │   ├── models/            # 10 SQLAlchemy ORM models
│   │   ├── payments/          # routes, service, schemas
│   │   ├── reports/           # routes, service
│   │   ├── shared/            # dependencies, base schemas, utils
│   │   └── tenants/           # routes, service, schemas
│   ├── alembic/               # migration framework
│   ├── scripts/               # seed_demo_data.py
│   ├── tests/
│   │   └── integration/       # 9 test modules (one per domain)
│   ├── main.py                # FastAPI app + router registration
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   └── src/
│       ├── api/               # 12 axios API client modules + client.ts
│       ├── components/        # shared UI components
│       ├── hooks/             # custom React hooks
│       ├── lib/               # utilities and helpers
│       ├── pages/             # 15 page components
│       ├── router/            # React Router config
│       ├── stores/            # Zustand state
│       ├── styles/            # global CSS
│       └── types/             # TypeScript interfaces
├── database/
│   ├── schema.sql             # canonical schema (source of truth)
│   └── seed.sql
├── docs/
│   └── openapi.yaml           # complete OpenAPI 3.0 spec (2100+ lines)
├── justfile                   # all dev commands
├── docker-compose.yml         # local dev (postgres + api)
├── docker-compose.test.yml    # test environment
└── ruff.toml
```

## Database

Schema lives in `database/schema.sql`. Apply it with:

```bash
psql -U <user> -d <dbname> -f database/schema.sql
```

### Design rules (enforce in all future DDL)

- All PKs are UUID with `DEFAULT gen_random_uuid()`
- Every table includes `id`, `public_id` (UUID, unique), `created_at` (TIMESTAMPTZ, `DEFAULT now()`), `is_active` (BOOLEAN NOT NULL DEFAULT TRUE)
- `due_expense` is the sole exception — it has no `public_id`
- Monetary values use `NUMERIC(10,2)` — never `FLOAT`
- Status/enum-like columns use `VARCHAR` + `CHECK (col IN (...))` — no PostgreSQL `ENUM` types
- All foreign keys use `ON DELETE RESTRICT`
- Soft deletes only via `is_active`; no hard deletes

### Schema overview

```
owner
 └── building
      └── apartment
           └── tenant
                └── tenant_agreement
                     └── monthly_due ──── payment_record
                          └── due_expense
owner ──── expense_category
owner ──── expense (optionally scoped to building or apartment)
expense ── due_expense
```

**Tables:**

| Table | Notable columns |
|---|---|
| `owner` | `full_name, email, hashed_password` |
| `building` | `owner_id, name, address, total_floors` |
| `apartment` | `building_id, unit_number, floor, status (vacant\|occupied)` |
| `tenant` | `apartment_id, full_name, phone, nid_number, address, member_count, move_in_date, move_out_date` |
| `tenant_agreement` | `tenant_id, rent_amount, start_date, end_date` |
| `monthly_due` | `tenant_id, agreement_id, month, year, rent_amount, total_due, amount_paid, remaining_balance, status (unpaid\|partial\|paid), is_auto_generated, due_date` |
| `payment_record` | `due_id, amount_paid, paid_on, note, is_bulk` |
| `expense_category` | `owner_id, name, is_default` |
| `expense` | `owner_id, building_id, apartment_id, category_id, description, amount, expense_date, scope (building\|apartment), is_tenant_charged` |
| `due_expense` | `due_id, expense_id, charged_amount` — no `public_id` |

**Key business constraints:**

- `apartment(building_id, unit_number)` is UNIQUE
- `monthly_due(tenant_id, month, year)` is UNIQUE
- `due_expense(due_id, expense_id)` is UNIQUE
- `monthly_due.month` is constrained `BETWEEN 1 AND 12`
- `monthly_due.year` is constrained `BETWEEN 2000 AND 2100`
- `expense_category` has `is_default BOOLEAN NOT NULL DEFAULT FALSE` — default categories cannot be deactivated

## Architecture decisions

### Identity pattern

- Every table exposes `public_id` to the frontend — never `id`
- Backend receives `public_id` from frontend, resolves to internal `id` before any DB query
- Internal `id` never appears in any API response, URL, or frontend state

### Soft delete pattern

- Never use DELETE statements — always `SET is_active = FALSE`
- Every SELECT query must filter `WHERE is_active = TRUE`
- This rule applies to every table, every query, no exceptions
- `expense_category` records where `is_default = TRUE` cannot be deactivated

### Multi-tenancy isolation

- Every owner sees only their own data
- Every query on building, apartment, tenant, expense, expense_category must verify the ownership chain back to the authenticated owner
- Ownership is never assumed from request body — always verified from JWT token

### Rent agreement pattern

- Rent amount lives on `tenant_agreement`, not on `tenant` or `apartment`
- A tenant can have multiple agreements over time (rent changes)
- Active agreement = `is_active = TRUE AND end_date IS NULL`
- `monthly_due` snapshots `rent_amount` at time of generation — historical accuracy preserved

### Payment ledger pattern

- `MonthlyDue` = what is owed (generated monthly)
- `PaymentRecord` = what was received (recorded manually by owner)
- One `MonthlyDue` can have many `PaymentRecord`s (partial payments)
- Bulk payment distributes oldest-due-first across multiple `MonthlyDue`s
- Status transitions: `unpaid → partial → paid` (never backwards)
- `remaining_balance` must be recalculated after every `PaymentRecord` insert

### Expense pattern

- Expenses are either owner costs (`is_tenant_charged = FALSE`) or tenant-charged (`is_tenant_charged = TRUE`)
- Tenant-charged expenses link to `MonthlyDue` via `due_expense` junction table
- Building-level expense: `building_id` set, `apartment_id` NULL
- Apartment-level expense: both `building_id` and `apartment_id` set

### Frontend form pattern

- All forms use `useForm` + `zodResolver` + shadcn `Form` wrapping `react-hook-form`
- Always use the custom form convenience components from `@/components/custom-ui/form/` — never inline `FormField` + `Input`/`Textarea`
- Available custom form components:

| Component | Wraps | Key props |
|---|---|---|
| `FormInput` | `Input` | `form`, `name`, `label`, `isRequired`, `type`, `placeholder`, `description`, `autoComplete`, `onChange` |
| `FormTextArea` | `Textarea` | `form`, `name`, `label`, `isRequired`, `placeholder`, `description`, `rows` |
| `FormDatePicker` | Calendar popover | `form`, `name`, `label`, `isRequired`, `placeholder`, `description`, `labelIcon`, `mode` (`"start"\|"end"`) |
| `FormStaticSelect` | `Select` (static) | `form`, `name`, `label`, `options`, `isRequired`, `placeholder` |
| `FormSearchSelect` | `Select` (async fetcher) | `form`, `name`, `label`, `fetcher`, `isRequired`, `placeholder`, `disabled`, `emptyMessage` |
| `FormRadioGroup` | `RadioGroup` | `form`, `name`, `label`, `options` |

- `FormInput.onChange` is an override for custom change handling — use `form.setValue` inside it to update the field
- Standalone selects (not inside a form) use shadcn `Select` directly — never raw `<select>` elements

### shadcn component rule

**All UI must use shadcn components — raw HTML elements are not permitted unless explicitly justified.**

- `<button>` → `Button` (from `@/components/ui/button`)
- `<input>` → `Input` or one of the custom `Form*` components
- `<select>` → `Select/SelectTrigger/SelectContent/SelectItem/SelectValue`
- `<label>` → `Label` (from `@/components/ui/label`)
- `<textarea>` → `Textarea` or `FormTextArea`
- `<table>/<thead>/<tbody>/<tfoot>/<tr>/<th>/<td>` → `Table/TableHeader/TableBody/TableFooter/TableRow/TableHead/TableCell` (from `@/components/ui/table`)

**Permitted exceptions** (do not replace these):
- Print-only views (`hidden print:block`) — shadcn adds no value in print-only markup
- Structural/layout divs, spans with no shadcn equivalent
- `<a>` used for navigation (not as a button)

## API

### Response envelope

All endpoints return:

```json
{ "success": true, "data": <any>, "message": "<string>" }
```

- Pagination on all list endpoints: `page` (1-based), `page_size`, `total`
- Dates as `YYYY-MM-DD`, timestamps as ISO 8601
- `public_id` in all URLs and responses — never internal `id`
- HTTP codes: 200 success, 201 created, 400 bad input, 401 unauthenticated, 403 unauthorized, 404 not found, 422 validation error

### OpenAPI spec

`docs/openapi.yaml` — complete 3.0 spec.
Interactive docs at `http://localhost:8000/docs` when the dev server is running.

### Registered routers

| Domain | Prefix |
|---|---|
| Auth | `/api/v1/auth` |
| Buildings | `/api/v1/buildings` |
| Apartments | `/api/v1/buildings/{building_public_id}/apartments` |
| Tenants (apartment-scoped) | `/api/v1/apartments/{apartment_public_id}/tenants` |
| Tenants (portfolio) | `/api/v1/tenants` |
| Agreements | `/api/v1/tenants/{tenant_public_id}/agreements` + `/api/v1/agreements` |
| Dues | `/api/v1/tenants/{tenant_public_id}/dues` + `/api/v1/dues` |
| Payments | `/api/v1/dues/{due_public_id}/payments` + `/api/v1/payments` |
| Expenses | `/api/v1/expenses` + `/api/v1/expense-categories` |
| Dashboard | `/api/v1/dashboard` |
| Reports | `/api/v1/reports` |

### Endpoint reference

**Auth**
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

**Buildings**
- `GET /api/v1/buildings` (paginated)
- `POST /api/v1/buildings`
- `GET /api/v1/buildings/{public_id}`
- `PUT /api/v1/buildings/{public_id}`
- `DELETE /api/v1/buildings/{public_id}`

**Apartments**
- `GET /api/v1/buildings/{building_public_id}/apartments` (paginated, filter: `status=vacant|occupied`)
- `POST /api/v1/buildings/{building_public_id}/apartments`
- `GET /api/v1/buildings/{building_public_id}/apartments/{apartment_public_id}`
- `PUT /api/v1/buildings/{building_public_id}/apartments/{apartment_public_id}`
- `DELETE /api/v1/buildings/{building_public_id}/apartments/{apartment_public_id}`

**Tenants**
- `GET /api/v1/tenants` (paginated, filter: `active|moved_out`)
- `GET /api/v1/tenants/{tenant_public_id}`
- `POST /api/v1/apartments/{apartment_public_id}/tenants`
- `GET /api/v1/apartments/{apartment_public_id}/tenants/active`
- `GET /api/v1/apartments/{apartment_public_id}/tenants/{tenant_public_id}`
- `PUT /api/v1/apartments/{apartment_public_id}/tenants/{tenant_public_id}`
- `DELETE /api/v1/apartments/{apartment_public_id}/tenants/{tenant_public_id}`

**Agreements**
- `GET /api/v1/tenants/{tenant_public_id}/agreements`
- `POST /api/v1/tenants/{tenant_public_id}/agreements`
- `POST /api/v1/agreements/bulk-adjust`

**Dues**
- `POST /api/v1/tenants/{tenant_public_id}/dues/generate`
- `GET /api/v1/tenants/{tenant_public_id}/dues` (paginated, filter: `status`, `year`)
- `PUT /api/v1/dues/{due_public_id}`
- `GET /api/v1/dues/pending-count`
- `POST /api/v1/dues/generate-bulk`

**Payments**
- `POST /api/v1/dues/{due_public_id}/payments`
- `DELETE /api/v1/payments/{payment_public_id}`
- `GET /api/v1/dues/{due_public_id}/payments`
- `POST /api/v1/payments/bulk`
- `GET /api/v1/payments/bulk-history` (paginated)

**Expenses**
- `GET /api/v1/expense-categories` (paginated)
- `POST /api/v1/expense-categories`
- `DELETE /api/v1/expense-categories/{public_id}`
- `GET /api/v1/expenses` (paginated, filter: `building_id`, `apartment_id`)
- `POST /api/v1/expenses`
- `GET /api/v1/expenses/{public_id}`
- `PUT /api/v1/expenses/{public_id}`
- `DELETE /api/v1/expenses/{public_id}`

**Dashboard**
- `GET /api/v1/dashboard/summary` (optional `month`, `year` query params)

**Reports**
- `GET /api/v1/reports/payment-history?tenant_public_id=<id>`
- `GET /api/v1/reports/annual-summary?year=<year>`
- `GET /api/v1/reports/overdue-list`

## Frontend pages

| Route | Page component |
|---|---|
| `/login` | `LoginPage.tsx` |
| `/register` | `RegisterPage.tsx` |
| `/dashboard` | `DashboardPage.tsx` |
| `/buildings` | `BuildingsPage.tsx` |
| `/buildings/:id` | `BuildingDetailPage.tsx` |
| `/apartments` | `ApartmentsPage.tsx` |
| `/apartments/:id` | `ApartmentDetailPage.tsx` |
| `/tenants` | `TenantsPage.tsx` |
| `/tenants/:tenantId` | `TenantDetailPage.tsx` |
| `/payments` | `PaymentsPage.tsx` |
| `/payment-history` | `PaymentHistoryPage.tsx` |
| `/reports` | `ReportsPage.tsx` |
| `/expenses` | `ExpensesPage.tsx` |
| `/settings` | `SettingsPage.tsx` |
| `/user-manual` | `UserManualPage.tsx` |

## Testing

**Every new API endpoint or feature must include corresponding tests — never defer.**

### Backend

Tests live in `backend/tests/integration/`. One file per domain:

- `test_auth.py`, `test_buildings.py`, `test_apartments.py`, `test_tenants.py`
- `test_agreements.py`, `test_dues.py`, `test_payments.py`
- `test_dashboard.py`, `test_reports.py`

Fixtures from `backend/tests/conftest.py`: `db`, `client`, `auth_token`.

- Tests use `httpx.AsyncClient` against the FastAPI app with a real test database
- Assert against JSON response fields — not ORM objects
- Every test is isolated; shared state comes only from fixtures

### Frontend

Tests live in `frontend/tests/`:

- `integration/` — 7 test modules (auth, buildings, dashboard, expenses, navigation, payments, tenants)
- `mocks/` — MSW mock service workers

## Development commands

```bash
# Setup
just setup                # full setup: venv, deps, db-create, migrate, pre-commit
just venv                 # create Python virtual environment
just deps                 # install backend dependencies
just deps-dev             # install backend + dev dependencies
just frontend-deps        # install frontend dependencies

# Database
just db-create            # create dev database
just db-drop              # drop dev database
just db-reset             # drop + create + apply schema + seed
just db-reset-test        # reset test database
just schema-apply         # apply schema.sql to dev db
just seed                 # run seed.sql
just seed-demo            # generate demo data (2025-2026)

# Running
just run                  # start FastAPI server (port 8000)
just dev                  # alias for just run
just frontend-dev         # start React dev server

# Testing (backend)
just test                 # run all pytest tests
just test-integration     # integration tests only
just test-unit            # unit tests only
just test-coverage        # generate coverage report
just test-file <path>     # run a single test file
just test-k <keyword>     # filter tests by keyword

# Testing (frontend)
just frontend-test            # vitest unit/integration tests
just frontend-test-watch      # vitest in watch mode
just frontend-test-integration # integration tests
just frontend-test-e2e        # Playwright E2E tests

# Code quality
just format               # ruff format
just lint                 # ruff lint
just lint-fix             # lint + auto-fix
just check                # lint + format check (full)
just frontend-check       # TypeScript type check
just ready                # check + test (pre-commit verification)

# Docker
just docker-up            # start services
just docker-down          # stop services
just docker-test          # run tests in container
```
