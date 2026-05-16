#!/usr/bin/env python
"""
Seed comprehensive demo data for RentFlow testing.
Covers 2025 (full year) + 2026 (Jan-May) across 2 buildings, 4 tenants.

Usage:
    python backend/scripts/seed_demo_data.py [--email EMAIL] [--password PASSWORD]

Defaults:
    --email: abrarhaider1357@gmail.com
    --password: password123 (only used if creating a new owner)
"""

import argparse
import asyncio
import os
import sys
import uuid
from decimal import Decimal
from typing import Any

import asyncpg

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.security import hash_password  # noqa: E402

# ── constants ──────────────────────────────────────────────────────────────────
DEFAULT_EMAIL = "abrarhaider1357@gmail.com"
DEFAULT_PASSWORD = "password123"
DB_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/rentflow_dev",
).replace("postgresql+asyncpg://", "postgresql://")

# ── helpers ────────────────────────────────────────────────────────────────────


def uid() -> str:
    return str(uuid.uuid4())


def dec(v: int | str) -> str:
    return str(Decimal(v))


# ── owner ──────────────────────────────────────────────────────────────────────


async def get_or_create_owner(conn: asyncpg.Connection, email: str, password: str) -> str:
    row = await conn.fetchrow("SELECT id, full_name FROM owner WHERE email = $1", email)
    if row:
        print(f"✓ Found existing owner: {row['full_name']} ({email})")
        return str(row["id"])

    hashed = hash_password(password)
    owner_id = uid()
    await conn.execute(
        """
        INSERT INTO owner (id, public_id, full_name, email, hashed_password)
        VALUES ($1::uuid, $2::uuid, 'Demo Owner', $3, $4)
        """,
        owner_id,
        owner_id,
        email,
        hashed,
    )
    print(f"✓ Created owner: {email} (password: {password})")
    return owner_id


# ── cleanup ────────────────────────────────────────────────────────────────────


async def clean_owner_data(conn: asyncpg.Connection, owner_id: str) -> None:
    """Delete all data for this owner in reverse FK order."""
    tables = [
        (
            "due_expense",
            "due_id IN (SELECT id FROM monthly_due WHERE tenant_id IN (SELECT id FROM tenant WHERE apartment_id IN (SELECT id FROM apartment WHERE building_id IN (SELECT id FROM building WHERE owner_id = $1))))",
        ),
        (
            "payment_record",
            "due_id IN (SELECT id FROM monthly_due WHERE tenant_id IN (SELECT id FROM tenant WHERE apartment_id IN (SELECT id FROM apartment WHERE building_id IN (SELECT id FROM building WHERE owner_id = $1))))",
        ),
        (
            "monthly_due",
            "tenant_id IN (SELECT id FROM tenant WHERE apartment_id IN (SELECT id FROM apartment WHERE building_id IN (SELECT id FROM building WHERE owner_id = $1)))",
        ),
        (
            "tenant_agreement",
            "tenant_id IN (SELECT id FROM tenant WHERE apartment_id IN (SELECT id FROM apartment WHERE building_id IN (SELECT id FROM building WHERE owner_id = $1)))",
        ),
        (
            "tenant",
            "apartment_id IN (SELECT id FROM apartment WHERE building_id IN (SELECT id FROM building WHERE owner_id = $1))",
        ),
        ("expense", "owner_id = $1"),
        ("expense_category", "owner_id = $1"),
        ("apartment", "building_id IN (SELECT id FROM building WHERE owner_id = $1)"),
        ("building", "owner_id = $1"),
    ]
    for table, where in tables:
        result = await conn.execute(f"DELETE FROM {table} WHERE {where}", owner_id)
        deleted = int(result.split()[-1]) if "DELETE" in result else 0
        if deleted:
            print(f"  Deleted {deleted} rows from {table}")

    print("  ✓ Cleaned existing data")


# ── seed data ──────────────────────────────────────────────────────────────────


async def seed_all(conn: asyncpg.Connection, owner_id: str) -> dict[str, Any]:
    data: dict[str, Any] = {"owner_id": owner_id}

    # ---- buildings ----
    data["b1"] = uid()
    data["b2"] = uid()
    await conn.execute(
        "INSERT INTO building (id, public_id, owner_id, name, address, total_floors) VALUES ($1::uuid, $1::uuid, $2::uuid, 'আল-আমিন টাওয়ার', 'Dhaka', 3), ($3::uuid, $3::uuid, $2::uuid, 'রহমান ভিলা', 'Chittagong', 2)",
        data["b1"],
        owner_id,
        data["b2"],
    )
    print("  ✓ 2 buildings")

    # ---- apartments ----
    data["apt_101"] = uid()
    data["apt_102"] = uid()
    data["apt_201"] = uid()
    data["apt_301"] = uid()
    data["apt_A1"] = uid()
    data["apt_A2"] = uid()
    await conn.execute(
        """INSERT INTO apartment (id, public_id, building_id, unit_number, floor, status) VALUES
           ($1::uuid, $1::uuid, $7::uuid, '101', 1, 'occupied'),
           ($2::uuid, $2::uuid, $7::uuid, '102', 1, 'vacant'),
           ($3::uuid, $3::uuid, $7::uuid, '201', 2, 'occupied'),
           ($4::uuid, $4::uuid, $7::uuid, '301', 3, 'occupied'),
           ($5::uuid, $5::uuid, $8::uuid, 'A1', 1, 'occupied'),
           ($6::uuid, $6::uuid, $8::uuid, 'A2', 2, 'vacant')""",
        data["apt_101"],
        data["apt_102"],
        data["apt_201"],
        data["apt_301"],
        data["apt_A1"],
        data["apt_A2"],
        data["b1"],
        data["b2"],
    )
    print("  ✓ 6 apartments (4 occupied, 2 vacant)")

    # ---- tenants ----
    data["t_karim"] = uid()
    data["t_nasrin"] = uid()
    data["t_sabbir"] = uid()
    data["t_jalal"] = uid()
    await conn.execute(
        """INSERT INTO tenant (id, public_id, apartment_id, full_name, phone, nid_number, address, member_count, move_in_date, move_out_date, is_active) VALUES
           ($1::uuid,  $1::uuid,  $5::uuid,  'Karim Hossain',  '01712345678', 'NID100001', 'Dhaka',       2, '2024-06-01', NULL::date,   TRUE),
           ($2::uuid,  $2::uuid,  $6::uuid,  'Nasrin Begum',   '01712345679', 'NID100002', 'Dhaka',       1, '2025-01-01', NULL::date,   TRUE),
           ($3::uuid,  $3::uuid,  $7::uuid,  'Sabbir Rahman',  '01712345680', 'NID100003', 'Dhaka',       1, '2025-03-01', NULL::date,   TRUE),
           ($4::uuid,  $4::uuid,  $8::uuid,  'Jalal Ahmed',    '01712345681', 'NID100004', 'Chittagong',  3, '2024-01-01', '2025-08-31'::date, FALSE)""",
        data["t_karim"],
        data["t_nasrin"],
        data["t_sabbir"],
        data["t_jalal"],
        data["apt_101"],
        data["apt_201"],
        data["apt_301"],
        data["apt_A1"],
    )
    print("  ✓ 4 tenants (3 active, 1 moved out)")

    # ---- agreements ----
    data["agr_karim1"] = uid()
    data["agr_karim2"] = uid()
    data["agr_nasrin"] = uid()
    data["agr_sabbir"] = uid()
    data["agr_jalal"] = uid()
    await conn.execute(
        """INSERT INTO tenant_agreement (id, public_id, tenant_id, rent_amount, start_date, end_date, is_active) VALUES
           ($1::uuid,  $1::uuid,  $6::uuid,  15000.00, '2024-06-01', '2025-06-30', TRUE),   -- Karim: old agreement
           ($2::uuid,  $2::uuid,  $6::uuid,  18000.00, '2025-07-01', NULL,         TRUE),   -- Karim: rent increase
           ($3::uuid,  $3::uuid,  $7::uuid,  12000.00, '2025-01-01', NULL,         TRUE),   -- Nasrin
           ($4::uuid,  $4::uuid,  $8::uuid,  10000.00, '2025-03-01', NULL,         TRUE),   -- Sabbir
           ($5::uuid,  $5::uuid,  $9::uuid,   8000.00, '2024-01-01', '2025-08-31', FALSE)""",  # Jalal (inactive)
        data["agr_karim1"],
        data["agr_karim2"],
        data["agr_nasrin"],
        data["agr_sabbir"],
        data["agr_jalal"],
        data["t_karim"],
        data["t_nasrin"],
        data["t_sabbir"],
        data["t_jalal"],
    )
    print("  ✓ 5 agreements (1 rent increase mid-2025)")

    # ---- monthly dues ----
    await seed_dues(conn, data)
    # ---- payment records ----
    await seed_payments(conn, data)
    # ---- expense categories ----
    await seed_expense_categories(conn, owner_id, data)
    # ---- expenses ----
    await seed_expenses(conn, owner_id, data)
    # ---- due expenses ----
    await seed_due_expenses(conn, data)
    # ---- simulate bulk payments ----
    await seed_bulk_demo(conn, data)

    return data


async def seed_dues(conn: asyncpg.Connection, d: dict[str, Any]) -> None:
    """Seed 2025 (12 months) + 2026 (Jan-May) for each tenant."""
    due_records = []
    payment_records: list[tuple[str, str, str, str, str | None]] = []
    d["due_ids"] = {}

    def add_due(
        tenant_key: str,
        agr_key: str,
        month: int,
        year: int,
        rent: int,
        total_due_amt: int,
        amount_paid: int,
        remaining: int,
        status: str,
        due_date_str: str,
        payments: list[tuple[int, str, str | None]] | None = None,
    ) -> str:
        due_id = uid()
        d["due_ids"][f"{tenant_key}_{year}_{month}"] = due_id
        due_records.append(
            f"('{due_id}'::uuid, '{due_id}'::uuid, '{d[tenant_key]}'::uuid, "
            f"'{d[agr_key]}'::uuid, {month}, {year}, "
            f"{dec(rent)}, {dec(total_due_amt)}, {dec(amount_paid)}, "
            f"{dec(remaining)}, '{status}', TRUE, '{due_date_str}'::date)"
        )
        if payments:
            for amt, paid_on, note in payments:
                note_val = f"'{note}'" if note else "NULL"
                payment_records.append((uid(), due_id, dec(amt), paid_on, note_val))
        return due_id

    # ── Karim: 2025 (rent 15000 Jan-Jun, 18000 Jul-Dec) ──
    # Jan: paid
    add_due(
        "t_karim",
        "agr_karim1",
        1,
        2025,
        15000,
        15000,
        15000,
        0,
        "paid",
        "2025-01-01",
        [(15000, "2025-01-10", None)],
    )
    # Feb: partial (paid 10000)
    add_due(
        "t_karim",
        "agr_karim1",
        2,
        2025,
        15000,
        15000,
        10000,
        5000,
        "partial",
        "2025-02-01",
        [(10000, "2025-02-15", None)],
    )
    # Mar: unpaid (overdue)
    add_due("t_karim", "agr_karim1", 3, 2025, 15000, 15000, 0, 15000, "unpaid", "2025-03-01")
    # Apr: paid
    add_due(
        "t_karim",
        "agr_karim1",
        4,
        2025,
        15000,
        15000,
        15000,
        0,
        "paid",
        "2025-04-01",
        [(15000, "2025-04-10", None)],
    )
    # May: paid
    add_due(
        "t_karim",
        "agr_karim1",
        5,
        2025,
        15000,
        15000,
        15000,
        0,
        "paid",
        "2025-05-01",
        [(15000, "2025-05-10", None)],
    )
    # Jun: paid
    add_due(
        "t_karim",
        "agr_karim1",
        6,
        2025,
        15000,
        15000,
        15000,
        0,
        "paid",
        "2025-06-01",
        [(15000, "2025-06-10", None)],
    )
    # Jul: paid (new rent 18000)
    add_due(
        "t_karim",
        "agr_karim2",
        7,
        2025,
        18000,
        18000,
        18000,
        0,
        "paid",
        "2025-07-01",
        [(18000, "2025-07-10", None)],
    )
    # Aug: partial (2 payments: 8000 + 4000)
    add_due(
        "t_karim",
        "agr_karim2",
        8,
        2025,
        18000,
        18000,
        12000,
        6000,
        "partial",
        "2025-08-01",
        [(8000, "2025-08-15", "প্রথম কিস্তি"), (4000, "2025-08-25", "দ্বিতীয় কিস্তি")],
    )
    # Sep: unpaid (overdue)
    add_due("t_karim", "agr_karim2", 9, 2025, 18000, 18000, 0, 18000, "unpaid", "2025-09-01")
    # Oct: unpaid (overdue)
    add_due("t_karim", "agr_karim2", 10, 2025, 18000, 18000, 0, 18000, "unpaid", "2025-10-01")
    # Nov: unpaid (overdue)
    add_due("t_karim", "agr_karim2", 11, 2025, 18000, 18000, 0, 18000, "unpaid", "2025-11-01")
    # Dec: unpaid (overdue)
    add_due("t_karim", "agr_karim2", 12, 2025, 18000, 18000, 0, 18000, "unpaid", "2025-12-01")

    # ── Karim: 2026 (rent 18000) ──
    # Jan: paid
    add_due(
        "t_karim",
        "agr_karim2",
        1,
        2026,
        18000,
        18000,
        18000,
        0,
        "paid",
        "2026-01-01",
        [(18000, "2026-01-10", None)],
    )
    # Feb: partial (paid 10000)
    add_due(
        "t_karim",
        "agr_karim2",
        2,
        2026,
        18000,
        18000,
        10000,
        8000,
        "partial",
        "2026-02-01",
        [(10000, "2026-02-12", None)],
    )
    # Mar: unpaid (overdue)
    add_due("t_karim", "agr_karim2", 3, 2026, 18000, 18000, 0, 18000, "unpaid", "2026-03-01")
    # Apr: unpaid (overdue)
    add_due("t_karim", "agr_karim2", 4, 2026, 18000, 18000, 0, 18000, "unpaid", "2026-04-01")
    # May: unpaid (overdue — due_date May 1, today is May 16)
    add_due("t_karim", "agr_karim2", 5, 2026, 18000, 18000, 0, 18000, "unpaid", "2026-05-01")

    # ── Nasrin: 2025 (rent 12000, all paid) ──
    for m in range(1, 13):
        add_due(
            "t_nasrin",
            "agr_nasrin",
            m,
            2025,
            12000,
            12000,
            12000,
            0,
            "paid",
            f"2025-{m:02d}-01",
            [(12000, f"2025-{m:02d}-10", None)],
        )

    # ── Nasrin: 2026 (rent 12000, all paid) ──
    for m in range(1, 6):
        add_due(
            "t_nasrin",
            "agr_nasrin",
            m,
            2026,
            12000,
            12000,
            12000,
            0,
            "paid",
            f"2026-{m:02d}-01",
            [(12000, f"2026-{m:02d}-10", None)],
        )

    # ── Sabbir: 2025 (moved in Mar, rent 10000) ──
    # Mar: paid
    add_due(
        "t_sabbir",
        "agr_sabbir",
        3,
        2025,
        10000,
        10000,
        10000,
        0,
        "paid",
        "2025-03-01",
        [(10000, "2025-03-10", None)],
    )
    # Apr: paid
    add_due(
        "t_sabbir",
        "agr_sabbir",
        4,
        2025,
        10000,
        10000,
        10000,
        0,
        "paid",
        "2025-04-01",
        [(10000, "2025-04-10", None)],
    )
    # May: paid
    add_due(
        "t_sabbir",
        "agr_sabbir",
        5,
        2025,
        10000,
        10000,
        10000,
        0,
        "paid",
        "2025-05-01",
        [(10000, "2025-05-10", None)],
    )
    # Jun: partial (paid 6000)
    add_due(
        "t_sabbir",
        "agr_sabbir",
        6,
        2025,
        10000,
        10000,
        6000,
        4000,
        "partial",
        "2025-06-01",
        [(6000, "2025-06-15", None)],
    )
    # Jul-Dec: unpaid (overdue)
    for m in range(7, 13):
        add_due(
            "t_sabbir", "agr_sabbir", m, 2025, 10000, 10000, 0, 10000, "unpaid", f"2025-{m:02d}-01"
        )

    # ── Sabbir: 2026 (rent 10000) ──
    # Jan: paid
    add_due(
        "t_sabbir",
        "agr_sabbir",
        1,
        2026,
        10000,
        10000,
        10000,
        0,
        "paid",
        "2026-01-01",
        [(10000, "2026-01-12", None)],
    )
    # Feb-May: unpaid (overdue / current)
    for m in range(2, 6):
        add_due(
            "t_sabbir", "agr_sabbir", m, 2026, 10000, 10000, 0, 10000, "unpaid", f"2026-{m:02d}-01"
        )

    # ── Jalal: 2025 only (moved out Aug, rent 8000, all paid) ──
    for m in range(1, 9):
        add_due(
            "t_jalal",
            "agr_jalal",
            m,
            2025,
            8000,
            8000,
            8000,
            0,
            "paid",
            f"2025-{m:02d}-01",
            [(8000, f"2025-{m:02d}-10", None)],
        )

    # ---- insert dues ----
    batch_size = 20
    for i in range(0, len(due_records), batch_size):
        batch = due_records[i : i + batch_size]
        sql = (
            "INSERT INTO monthly_due (id, public_id, tenant_id, agreement_id, month, year, "
            "rent_amount, total_due, amount_paid, remaining_balance, status, is_auto_generated, due_date) "
            f"VALUES {', '.join(batch)}"
        )
        await conn.execute(sql)

    total_dues = len(due_records)
    print(f"  ✓ {total_dues} monthly dues (2025 + 2026)")

    # ---- insert payment records ----
    d["_payment_records"] = payment_records
    for i in range(0, len(payment_records), batch_size):
        batch = payment_records[i : i + batch_size]
        rows = ", ".join(
            f"('{pid}'::uuid, '{pid}'::uuid, '{due_id}'::uuid, "
            f"{amt}, '{paid_on}'::date, {note})"
            for pid, due_id, amt, paid_on, note in batch
        )
        await conn.execute(
            "INSERT INTO payment_record (id, public_id, due_id, amount_paid, paid_on, note) "
            f"VALUES {rows}"
        )

    total_payments = len(payment_records)
    print(f"  ✓ {total_payments} payment records")


async def seed_payments(conn: asyncpg.Connection, d: dict[str, Any]) -> None:
    """Payment records are already seeded inline during due creation.
    This function exists for clarity in the pipeline."""
    pass  # payments are seeded inside seed_dues


async def seed_expense_categories(
    conn: asyncpg.Connection, owner_id: str, d: dict[str, Any]
) -> None:
    cats = [
        ("Electricity", True),
        ("Water", True),
        ("Maintenance", False),
        ("Repair", False),
        ("Gas", False),
    ]
    d["cat_ids"] = {}
    for name, is_default in cats:
        cat_id = uid()
        d["cat_ids"][name.lower()] = cat_id
        await conn.execute(
            "INSERT INTO expense_category (id, public_id, owner_id, name, is_default) "
            "VALUES ($1::uuid, $1::uuid, $2::uuid, $3, $4)",
            cat_id,
            owner_id,
            name,
            is_default,
        )
    print(f"  ✓ {len(cats)} expense categories")


async def seed_expenses(conn: asyncpg.Connection, owner_id: str, d: dict[str, Any]) -> None:
    expenses = [
        # (key, building_id, apartment_id, cat_key, description, amount, date, scope, tenant_charged)
        (
            "exp_elec1",
            d["b1"],
            None,
            "electricity",
            "বিল্ডিং বিদ্যুৎ বিল",
            5000,
            "2025-03-15",
            "building",
            False,
        ),
        (
            "exp_elec2",
            d["b1"],
            None,
            "electricity",
            "বিল্ডিং বিদ্যুৎ বিল",
            5500,
            "2026-02-15",
            "building",
            False,
        ),
        ("exp_water1", d["b1"], None, "water", "পানির বিল", 3000, "2025-04-20", "building", False),
        (
            "exp_repair1",
            d["b1"],
            d["apt_101"],
            "repair",
            "এপার্টমেন্ট মেরামত",
            2000,
            "2025-02-10",
            "apartment",
            True,
        ),
        (
            "exp_maint1",
            d["b2"],
            None,
            "maintenance",
            "রক্ষণাবেক্ষণ খরচ",
            4000,
            "2025-05-10",
            "building",
            False,
        ),
        (
            "exp_gas1",
            d["b1"],
            d["apt_201"],
            "gas",
            "গ্যাস সংযোগ মেরামত",
            1500,
            "2025-06-15",
            "apartment",
            True,
        ),
        (
            "exp_maint2",
            d["b1"],
            None,
            "maintenance",
            "লিফট মেরামত",
            8000,
            "2026-01-20",
            "building",
            False,
        ),
        (
            "exp_gas2",
            d["b1"],
            d["apt_301"],
            "gas",
            "গ্যাস বিল",
            1200,
            "2026-03-10",
            "apartment",
            True,
        ),
    ]
    d["exp_ids"] = {}
    for key, bldg, apt, cat, desc, amt, edate, scope, tc in expenses:
        exp_id = uid()
        d["exp_ids"][key] = exp_id
        bldg_val = f"'{bldg}'::uuid" if bldg else "NULL"
        apt_val = f"'{apt}'::uuid" if apt else "NULL"
        await conn.execute(
            f"INSERT INTO expense (id, public_id, owner_id, building_id, apartment_id, "
            f"category_id, description, amount, expense_date, scope, is_tenant_charged) "
            f"VALUES ('{exp_id}'::uuid, '{exp_id}'::uuid, '{owner_id}'::uuid, {bldg_val}, {apt_val}, "
            f"'{d['cat_ids'][cat]}'::uuid, '{desc}', {dec(amt)}, '{edate}'::date, '{scope}', {str(tc).upper()})"
        )
    print(f"  ✓ {len(expenses)} expenses")


async def seed_due_expenses(conn: asyncpg.Connection, d: dict[str, Any]) -> None:
    """Link repair expense (2000) to Karim's Feb 2025 due."""
    due_id = d["due_ids"]["t_karim_2025_2"]  # Karim Feb 2025
    exp_id = d["exp_ids"]["exp_repair1"]
    de_id = uid()
    await conn.execute(
        "INSERT INTO due_expense (id, due_id, expense_id, charged_amount) "
        "VALUES ($1::uuid, $2::uuid, $3::uuid, 2000.00)",
        de_id,
        due_id,
        exp_id,
    )
    print("  ✓ 2 due_expenses (repair + gas linked to monthly dues)")

    # Also link gas expense to Sabbir's Jun 2025 due
    due_id2 = d["due_ids"]["t_sabbir_2025_6"]  # Sabbir Jun 2025
    exp_id2 = d["exp_ids"]["exp_gas1"]
    de_id2 = uid()
    await conn.execute(
        "INSERT INTO due_expense (id, due_id, expense_id, charged_amount) "
        "VALUES ($1::uuid, $2::uuid, $3::uuid, 1500.00)",
        de_id2,
        due_id2,
        exp_id2,
    )


async def seed_bulk_demo(conn: asyncpg.Connection, d: dict[str, Any]) -> None:
    """Mark some payment groups as bulk payments to demo the bulk history tab.

    Simulates two bulk payment transactions:
    1. Sabbir paid 3 months (Apr-Jun 2025) in one go on 2025-06-15 for 26000
    2. Karim paid 2 months (Jul-Aug 2025) in one go on 2025-08-15 for 26000
    """
    # Sabbir: Apr + May + Jun 2025 = 10000*3 = 30000, but Jun only paid 6000 = 26000 total
    sabbir_due_ids = [d["due_ids"].get(f"t_sabbir_2025_{m}") for m in [4, 5, 6]]
    await conn.execute(
        "UPDATE payment_record SET is_bulk = TRUE, paid_on = '2025-06-15'::date, note = 'বাল্ক পেমেন্ট - ৩ মাস' "
        "WHERE due_id = ANY($1::uuid[])",
        sabbir_due_ids,
    )

    # Karim: Jul + Aug 2025 = 18000 + 12000 = 30000
    karim_due_ids = [d["due_ids"].get(f"t_karim_2025_{m}") for m in [7, 8]]
    await conn.execute(
        "UPDATE payment_record SET is_bulk = TRUE, paid_on = '2025-08-15'::date, note = 'বাল্ক পেমেন্ট - ২ মাস (আংশিক)' "
        "WHERE due_id = ANY($1::uuid[])",
        karim_due_ids,
    )

    # Nasrin: Jan + Feb + Mar 2026 bulk payment
    nasrin_due_ids = [d["due_ids"].get(f"t_nasrin_2026_{m}") for m in [1, 2, 3]]
    await conn.execute(
        "UPDATE payment_record SET is_bulk = TRUE, paid_on = '2026-03-15'::date, note = 'বাল্ক পেমেন্ট - ৩ মাস' "
        "WHERE due_id = ANY($1::uuid[])",
        nasrin_due_ids,
    )

    print("  ✓ 3 bulk payment transactions simulated")


# ── main ───────────────────────────────────────────────────────────────────────


async def main(email: str, password: str) -> None:
    print("\n  RentFlow Demo Data Seeder")
    print(f"  {'─' * 30}")

    conn = await asyncpg.connect(DB_URL)
    try:
        owner_id = await get_or_create_owner(conn, email, password)
        await clean_owner_data(conn, owner_id)
        _ = await seed_all(conn, owner_id)

        print(f"\n  {'─' * 30}")
        print("  ✓ Demo data seeded successfully!")
        print(f"  Owner: {email}")
        print("  Data: 2 buildings, 6 apartments, 4 tenants, 5 agreements")
        print("  Dues: 2025 (full year) + 2026 (Jan-May)")
        print("  Statuses: paid, partial, unpaid across tenants")
        print("  Expenses: 8 expenses (building + apartment level)")
        print("  Due expenses: 2 (tenant-charged → monthly dues)")
        print(f"  {'─' * 30}\n")

        # Quick stats
        paid = await conn.fetchval(
            "SELECT COUNT(*) FROM monthly_due WHERE tenant_id IN (SELECT id FROM tenant WHERE apartment_id IN (SELECT id FROM apartment WHERE building_id IN (SELECT id FROM building WHERE owner_id = $1))) AND status = 'paid'",
            owner_id,
        )
        partial = await conn.fetchval(
            "SELECT COUNT(*) FROM monthly_due WHERE tenant_id IN (SELECT id FROM tenant WHERE apartment_id IN (SELECT id FROM apartment WHERE building_id IN (SELECT id FROM building WHERE owner_id = $1))) AND status = 'partial'",
            owner_id,
        )
        unpaid = await conn.fetchval(
            "SELECT COUNT(*) FROM monthly_due WHERE tenant_id IN (SELECT id FROM tenant WHERE apartment_id IN (SELECT id FROM apartment WHERE building_id IN (SELECT id FROM building WHERE owner_id = $1))) AND status = 'unpaid'",
            owner_id,
        )
        print(f"  Breakdown: {paid} paid | {partial} partial | {unpaid} unpaid\n")

    finally:
        await conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed demo data for RentFlow")
    parser.add_argument("--email", default=DEFAULT_EMAIL, help="Owner email")
    parser.add_argument(
        "--password", default=DEFAULT_PASSWORD, help="Owner password (only for new accounts)"
    )
    args = parser.parse_args()
    asyncio.run(main(args.email, args.password))
