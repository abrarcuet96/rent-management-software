# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

RentFlow is a multi-tenant Rent Management SaaS backed by PostgreSQL. The repository is in early stages — currently only the database schema exists.

## Database

Schema lives in `database/schema.sql`. Apply it against a PostgreSQL instance with:

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

Key business constraints:

- `apartment(building_id, unit_number)` is UNIQUE
- `monthly_due(tenant_id, month, year)` is UNIQUE
- `due_expense(due_id, expense_id)` is UNIQUE
- `monthly_due.month` is constrained `BETWEEN 1 AND 12`
- `monthly_due.year` is constrained `BETWEEN 2000 AND 2100`
- `expense_category` has an extra `is_default BOOLEAN NOT NULL DEFAULT FALSE` column

## Architecture decisions

### Identity pattern

- Every table exposes `public_id` to the frontend — never `id`
- Backend receives `public_id` from frontend, resolves to internal `id` before any DB query
- Internal `id` never appears in any API response, URL, or frontend state

### Soft delete pattern

- Never use DELETE statements — always SET is_active = FALSE
- Every SELECT query must filter WHERE is_active = TRUE
- This rule applies to every table, every query, no exceptions
- `expense_category` also has `is_default` — records where is_default = TRUE cannot be deactivated

### Multi-tenancy isolation

- Every owner sees only their own data
- Every query on building, apartment, tenant, expense, expense_category
  must verify ownership chain back to the authenticated owner
- Ownership is never assumed from request body — always verified from JWT token

### Rent agreement pattern

- Rent amount lives on tenant_agreement, not on tenant or apartment
- A tenant can have multiple agreements over time (rent changes)
- Active agreement = is_active = TRUE AND end_date IS NULL
- monthly_due snapshots rent_amount at time of generation — historical accuracy preserved

### Payment ledger pattern

- MonthlyDue = what is owed (generated monthly)
- PaymentRecord = what was received (recorded manually by owner)
- One MonthlyDue can have many PaymentRecords (partial payments)
- Bulk payment distributes oldest-first across multiple MonthlyDues
- Status transitions: unpaid → partial → paid (never backwards)
- remaining_balance must be recalculated after every PaymentRecord insert

### Expense pattern

- Expenses are either owner costs (is_tenant_charged = FALSE)
  or tenant-charged (is_tenant_charged = TRUE)
- Tenant-charged expenses link to MonthlyDue via due_expense junction table
- building-level expense: building_id set, apartment_id NULL
- apartment-level expense: both building_id and apartment_id set

## API conventions (to be enforced in all endpoints)

### OpenAPI specification

Complete specification in `docs/openapi.yaml` (2100+ lines).
Import into Swagger UI at http://localhost:8000/docs

Key design patterns enforced:
- All endpoints return standard envelope: { success, data, message }
- Pagination: page (1-based), page_size, total in list responses
- Bulk payment distributes oldest-due-first across multiple MonthlyDues
- All timestamps in ISO 8601, all dates as YYYY-MM-DD
- No internal id exposed — public_id in all URLs and responses

- All responses wrapped in a standard shape:
  { success: bool, data: any, message: str }
- Pagination on all list endpoints: page, page_size, total
- Dates returned as ISO 8601 strings
- public_id used in all URLs — never internal id
- HTTP status codes: 200 success, 201 created, 400 bad input,
  401 unauthenticated, 403 unauthorized, 404 not found, 422 validation error

## Stack

- Backend: Python, FastAPI, SQLAlchemy (async), Alembic, PostgreSQL
- Frontend: React, TypeScript, Shadcn UI, Tailwind CSS, TanStack Query, Axios

### Development commands (using just)

```bash
just setup-backend     # Create folder structure
just venv              # Create Python virtual environment
just deps              # Install dependencies
just migrate           # Run Alembic migrations
just dev               # Start FastAPI dev server (port 8000)
just test              # Run pytest suite
just db-reset          # Reset database (drop + create + seed schema)
```

Alembic lives in `backend/alembic/`. Database models in `backend/app/models/`.
