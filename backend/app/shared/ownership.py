"""Ownership-chain verification helpers.

Every entity below the Owner level (building → apartment → tenant → agreement → due → payment)
must be traceable to the authenticated owner before any read/write. These helpers resolve
public_id → internal id while enforcing that traversal, and raise 404 if the ownership
chain cannot be followed.
"""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.apartment import Apartment
from app.models.building import Building
from app.models.expense_category import ExpenseCategory
from app.models.monthly_due import MonthlyDue
from app.models.payment_record import PaymentRecord
from app.models.tenant import Tenant


async def resolve_tenant_id(
    db: AsyncSession,
    owner_id: UUID,
    tenant_public_id: UUID,
    require_active: bool = True,
) -> UUID:
    """Return the internal Tenant.id for a tenant owned by owner_id.

    Verifies the full chain: tenant → apartment → building → owner.
    Raises 404 if the tenant doesn't exist or isn't owned by this owner.
    Set require_active=False to allow looking up moved-out tenants (for history reads).
    """
    conditions = [
        Tenant.public_id == tenant_public_id,
        Apartment.is_active.is_(True),
        Building.owner_id == owner_id,
        Building.is_active.is_(True),
    ]
    if require_active:
        conditions.append(Tenant.is_active.is_(True))

    result = await db.execute(
        select(Tenant.id)
        .join(Apartment, Apartment.id == Tenant.apartment_id)
        .join(Building, Building.id == Apartment.building_id)
        .where(*conditions)
    )
    tenant_id = result.scalar_one_or_none()
    if tenant_id is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")
    return tenant_id


async def resolve_due(
    db: AsyncSession,
    owner_id: UUID,
    due_public_id: UUID,
) -> MonthlyDue:
    """Return the MonthlyDue row for a due owned (via tenant → apt → building) by owner_id.

    Raises 404 if the due doesn't exist or isn't owned by this owner.
    Returns the full ORM object so callers can mutate it for ledger updates.
    """
    result = await db.execute(
        select(MonthlyDue)
        .join(Tenant, Tenant.id == MonthlyDue.tenant_id)
        .join(Apartment, Apartment.id == Tenant.apartment_id)
        .join(Building, Building.id == Apartment.building_id)
        .where(
            MonthlyDue.public_id == due_public_id,
            MonthlyDue.is_active.is_(True),
            Building.owner_id == owner_id,
            Building.is_active.is_(True),
        )
    )
    due = result.scalar_one_or_none()
    if due is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Due not found")
    return due


async def resolve_building_id(
    db: AsyncSession,
    owner_id: UUID,
    building_public_id: UUID,
) -> UUID:
    """Return the internal Building.id for a building owned by owner_id."""
    building_id = await db.scalar(
        select(Building.id).where(
            Building.public_id == building_public_id,
            Building.owner_id == owner_id,
            Building.is_active.is_(True),
        )
    )
    if building_id is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Building not found")
    return building_id


async def resolve_apartment_id(
    db: AsyncSession,
    owner_id: UUID,
    apartment_public_id: UUID,
    building_id: UUID | None = None,
) -> UUID:
    """Return the internal Apartment.id for an apartment owned (via building) by owner_id.

    If building_id is provided, also verifies the apartment belongs to that building.
    """
    conditions = [
        Apartment.public_id == apartment_public_id,
        Apartment.is_active.is_(True),
        Building.owner_id == owner_id,
        Building.is_active.is_(True),
    ]
    if building_id is not None:
        conditions.append(Apartment.building_id == building_id)

    apt_id = await db.scalar(
        select(Apartment.id).join(Building, Building.id == Apartment.building_id).where(*conditions)
    )
    if apt_id is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Apartment not found")
    return apt_id


async def resolve_payment(
    db: AsyncSession,
    owner_id: UUID,
    payment_public_id: UUID,
) -> tuple[PaymentRecord, MonthlyDue]:
    """Return (PaymentRecord, MonthlyDue) for a payment owned via due→tenant→apt→building.

    Raises 404 if the payment doesn't exist or isn't owned by this owner.
    Returns both objects so the caller can mutate the due for ledger reversal.
    """
    result = await db.execute(
        select(PaymentRecord, MonthlyDue)
        .join(MonthlyDue, MonthlyDue.id == PaymentRecord.due_id)
        .join(Tenant, Tenant.id == MonthlyDue.tenant_id)
        .join(Apartment, Apartment.id == Tenant.apartment_id)
        .join(Building, Building.id == Apartment.building_id)
        .where(
            PaymentRecord.public_id == payment_public_id,
            PaymentRecord.is_active.is_(True),
            MonthlyDue.is_active.is_(True),
            Building.owner_id == owner_id,
            Building.is_active.is_(True),
        )
    )
    row = result.one_or_none()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    return row[0], row[1]


async def resolve_category_id(
    db: AsyncSession,
    owner_id: UUID,
    category_public_id: UUID,
) -> UUID:
    """Return the internal ExpenseCategory.id for a category owned by owner_id."""
    cat_id = await db.scalar(
        select(ExpenseCategory.id).where(
            ExpenseCategory.public_id == category_public_id,
            ExpenseCategory.owner_id == owner_id,
            ExpenseCategory.is_active.is_(True),
        )
    )
    if cat_id is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return cat_id
