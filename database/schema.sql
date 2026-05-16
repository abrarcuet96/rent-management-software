-- ============================================================
-- RentFlow – Multi-Tenant Rent Management SaaS
-- PostgreSQL DDL
-- ============================================================

-- ============================================================
-- TABLES (dependency order: parents before children)
-- ============================================================

-- ------------------------------------------------------------
-- owner
-- ------------------------------------------------------------
CREATE TABLE owner (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id       UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    full_name       VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL
);

-- ------------------------------------------------------------
-- building
-- ------------------------------------------------------------
CREATE TABLE building (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id    UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    owner_id     UUID NOT NULL REFERENCES owner(id) ON DELETE RESTRICT,
    name         VARCHAR(255) NOT NULL,
    address      TEXT NOT NULL,
    total_floors INTEGER NOT NULL
);

-- ------------------------------------------------------------
-- apartment
-- ------------------------------------------------------------
CREATE TABLE apartment (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id   UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    building_id UUID NOT NULL REFERENCES building(id) ON DELETE RESTRICT,
    unit_number VARCHAR(50) NOT NULL,
    floor       INTEGER NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'vacant'
                    CHECK (status IN ('vacant', 'occupied')),
    UNIQUE (building_id, unit_number)
);

-- ------------------------------------------------------------
-- tenant
-- ------------------------------------------------------------
CREATE TABLE tenant (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id     UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    apartment_id  UUID NOT NULL REFERENCES apartment(id) ON DELETE RESTRICT,
    full_name     VARCHAR(255) NOT NULL,
    phone         VARCHAR(20) NOT NULL,
    nid_number    VARCHAR(50),
    address       TEXT,
    member_count  INTEGER NOT NULL DEFAULT 1,
    move_in_date  DATE NOT NULL,
    move_out_date DATE
);

-- ------------------------------------------------------------
-- tenant_agreement
-- ------------------------------------------------------------
CREATE TABLE tenant_agreement (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id   UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    tenant_id   UUID NOT NULL REFERENCES tenant(id) ON DELETE RESTRICT,
    rent_amount NUMERIC(10,2) NOT NULL CHECK (rent_amount > 0),
    start_date  DATE NOT NULL,
    end_date    DATE
);

-- ------------------------------------------------------------
-- monthly_due
-- ------------------------------------------------------------
CREATE TABLE monthly_due (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id         UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    tenant_id         UUID NOT NULL REFERENCES tenant(id) ON DELETE RESTRICT,
    agreement_id      UUID NOT NULL REFERENCES tenant_agreement(id) ON DELETE RESTRICT,
    month             INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year              INTEGER NOT NULL CHECK (year BETWEEN 2000 AND 2100),
    rent_amount       NUMERIC(10,2) NOT NULL,
    total_due         NUMERIC(10,2) NOT NULL,
    amount_paid       NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    remaining_balance NUMERIC(10,2) NOT NULL CHECK (remaining_balance >= 0),
    status            VARCHAR(20) NOT NULL DEFAULT 'unpaid'
                          CHECK (status IN ('unpaid', 'partial', 'paid')),
    is_auto_generated BOOLEAN NOT NULL DEFAULT TRUE,
    due_date          DATE,
    UNIQUE (tenant_id, month, year)
);

-- ------------------------------------------------------------
-- payment_record
-- ------------------------------------------------------------
CREATE TABLE payment_record (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id   UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    due_id      UUID NOT NULL REFERENCES monthly_due(id) ON DELETE RESTRICT,
    amount_paid NUMERIC(10,2) NOT NULL CHECK (amount_paid > 0),
    paid_on     DATE NOT NULL,
    note        TEXT,
    is_bulk     BOOLEAN NOT NULL DEFAULT FALSE
);

-- ------------------------------------------------------------
-- expense_category
-- ------------------------------------------------------------
CREATE TABLE expense_category (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id  UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    owner_id   UUID NOT NULL REFERENCES owner(id) ON DELETE RESTRICT,
    name       VARCHAR(255) NOT NULL
);

-- ------------------------------------------------------------
-- expense
-- ------------------------------------------------------------
CREATE TABLE expense (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id         UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    owner_id          UUID NOT NULL REFERENCES owner(id) ON DELETE RESTRICT,
    building_id       UUID REFERENCES building(id) ON DELETE RESTRICT,
    apartment_id      UUID REFERENCES apartment(id) ON DELETE RESTRICT,
    category_id       UUID NOT NULL REFERENCES expense_category(id) ON DELETE RESTRICT,
    description       TEXT,
    amount            NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    expense_date      DATE NOT NULL,
    scope             VARCHAR(20) NOT NULL CHECK (scope IN ('building', 'apartment')),
    is_tenant_charged BOOLEAN NOT NULL DEFAULT FALSE
);

-- ------------------------------------------------------------
-- due_expense  (no public_id per spec)
-- ------------------------------------------------------------
CREATE TABLE due_expense (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    due_id         UUID NOT NULL REFERENCES monthly_due(id) ON DELETE RESTRICT,
    expense_id     UUID NOT NULL REFERENCES expense(id) ON DELETE RESTRICT,
    charged_amount NUMERIC(10,2) NOT NULL CHECK (charged_amount > 0),
    UNIQUE (due_id, expense_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- public_id unique indexes (one per table; due_expense has none)
CREATE UNIQUE INDEX idx_owner_public_id            ON owner(public_id);
CREATE UNIQUE INDEX idx_building_public_id         ON building(public_id);
CREATE UNIQUE INDEX idx_apartment_public_id        ON apartment(public_id);
CREATE UNIQUE INDEX idx_tenant_public_id           ON tenant(public_id);
CREATE UNIQUE INDEX idx_tenant_agreement_public_id ON tenant_agreement(public_id);
CREATE UNIQUE INDEX idx_monthly_due_public_id      ON monthly_due(public_id);
CREATE UNIQUE INDEX idx_payment_record_public_id   ON payment_record(public_id);
CREATE UNIQUE INDEX idx_expense_category_public_id ON expense_category(public_id);
CREATE UNIQUE INDEX idx_expense_public_id          ON expense(public_id);

-- foreign key indexes
CREATE INDEX idx_building_owner_id           ON building(owner_id);
CREATE INDEX idx_apartment_building_id       ON apartment(building_id);
CREATE INDEX idx_tenant_apartment_id         ON tenant(apartment_id);
CREATE INDEX idx_tenant_agreement_tenant_id  ON tenant_agreement(tenant_id);
CREATE INDEX idx_monthly_due_tenant_id       ON monthly_due(tenant_id);
CREATE INDEX idx_monthly_due_agreement_id    ON monthly_due(agreement_id);
CREATE INDEX idx_payment_record_due_id       ON payment_record(due_id);
CREATE INDEX idx_expense_category_owner_id   ON expense_category(owner_id);
CREATE INDEX idx_expense_owner_id            ON expense(owner_id);
CREATE INDEX idx_expense_building_id         ON expense(building_id);
CREATE INDEX idx_expense_apartment_id        ON expense(apartment_id);
CREATE INDEX idx_expense_category_id         ON expense(category_id);
CREATE INDEX idx_due_expense_due_id          ON due_expense(due_id);
CREATE INDEX idx_due_expense_expense_id      ON due_expense(expense_id);

-- apartment status filter
CREATE INDEX idx_apartment_status ON apartment(status);

-- monthly_due filters
CREATE INDEX idx_monthly_due_status     ON monthly_due(status);
CREATE INDEX idx_monthly_due_month_year ON monthly_due(month, year);
