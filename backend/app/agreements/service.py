from datetime import date, timedelta
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agreements.schemas import AgreementCreate, BulkRentAdjustRequest
from app.models.apartment import Apartment
from app.models.building import Building
from app.models.tenant import Tenant
from app.models.tenant_agreement import TenantAgreement
from app.shared.ownership import resolve_building_id, resolve_tenant_id


class AgreementService:
    def __init__(self, db: AsyncSession, owner_id: UUID) -> None:
        self.db = db
        self.owner_id = owner_id

    async def list_agreements(self, tenant_public_id: UUID) -> list[TenantAgreement]:
        """Return all agreements (active and historical) for one tenant, newest first.

        We intentionally return inactive (historical) agreements as well so the UI
        can show the rent history of a tenant.
        """
        tenant_id = await resolve_tenant_id(
            self.db, self.owner_id, tenant_public_id, require_active=False
        )
        result = await self.db.execute(
            select(TenantAgreement)
            .where(TenantAgreement.tenant_id == tenant_id)
            .order_by(TenantAgreement.start_date.desc())
        )
        return list(result.scalars().all())

    async def _close_active_agreement(self, tenant_id: UUID, new_start: date) -> None:
        """Close the tenant's currently-active agreement, if any.

        Sets end_date = new_start - 1 day and is_active = False. Raises 400 if
        the new start_date doesn't come strictly after the active agreement's
        start_date — that would either overlap or back-date in a way that breaks
        the monotonic agreement timeline.
        """
        result = await self.db.execute(
            select(TenantAgreement).where(
                TenantAgreement.tenant_id == tenant_id,
                TenantAgreement.is_active.is_(True),
                TenantAgreement.end_date.is_(None),
            )
        )
        active = result.scalar_one_or_none()
        if active is None:
            return
        if new_start <= active.start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New agreement start_date must be after the current agreement's start_date",
            )
        active.end_date = new_start - timedelta(days=1)
        active.is_active = False

    async def create_agreement(
        self, tenant_public_id: UUID, data: AgreementCreate
    ) -> TenantAgreement:
        """Create a new agreement, closing any active prior agreement atomically."""
        tenant_id = await resolve_tenant_id(self.db, self.owner_id, tenant_public_id)
        await self._close_active_agreement(tenant_id, data.start_date)

        agreement = TenantAgreement(
            tenant_id=tenant_id,
            rent_amount=data.rent_amount,
            start_date=data.start_date,
        )
        self.db.add(agreement)
        await self.db.commit()
        await self.db.refresh(agreement)
        return agreement

    def _apply_adjustment(
        self, old_rent: Decimal, adjustment_type: str, amount: Decimal
    ) -> Decimal:
        if adjustment_type == "fixed":
            new_rent = old_rent + amount
        else:  # percentage
            new_rent = old_rent * (Decimal("1") + amount / Decimal("100"))
        # Round to 2 decimals to match NUMERIC(10,2)
        new_rent = new_rent.quantize(Decimal("0.01"))
        if new_rent <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Adjusted rent would be zero or negative for at least one tenant",
            )
        return new_rent

    async def bulk_adjust_rent(
        self, data: BulkRentAdjustRequest
    ) -> tuple[list[TenantAgreement], list[UUID]]:
        """Adjust rent for many tenants in one transaction.

        Returns (new_agreements, tenant_public_ids_in_order) so the caller can
        build the response. Every step (close old + create new) for every tenant
        commits together — partial failure rolls back the whole batch.
        """
        # Build the query that selects (tenant_id, active_agreement) for every affected tenant
        stmt = (
            select(Tenant.id, Tenant.public_id, TenantAgreement)
            .join(TenantAgreement, TenantAgreement.tenant_id == Tenant.id)
            .join(Apartment, Apartment.id == Tenant.apartment_id)
            .join(Building, Building.id == Apartment.building_id)
            .where(
                Tenant.is_active.is_(True),
                Apartment.is_active.is_(True),
                Building.owner_id == self.owner_id,
                Building.is_active.is_(True),
                TenantAgreement.is_active.is_(True),
                TenantAgreement.end_date.is_(None),
            )
        )
        if data.scope == "building":
            assert data.building_public_id is not None  # validator enforces this
            building_id = await resolve_building_id(self.db, self.owner_id, data.building_public_id)
            stmt = stmt.where(Building.id == building_id)

        result = await self.db.execute(stmt)
        rows = result.all()

        new_agreements: list[TenantAgreement] = []
        tenant_public_ids: list[UUID] = []

        for tenant_id, tenant_public_id, old_agreement in rows:
            if data.effective_date <= old_agreement.start_date:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"effective_date must be after every affected tenant's current "
                        f"agreement start_date (conflict on tenant {tenant_public_id})"
                    ),
                )
            new_rent = self._apply_adjustment(
                old_agreement.rent_amount, data.adjustment_type, data.amount
            )

            old_agreement.end_date = data.effective_date - timedelta(days=1)
            old_agreement.is_active = False

            new_agreement = TenantAgreement(
                tenant_id=tenant_id,
                rent_amount=new_rent,
                start_date=data.effective_date,
            )
            self.db.add(new_agreement)
            new_agreements.append(new_agreement)
            tenant_public_ids.append(tenant_public_id)

        await self.db.commit()
        for ag in new_agreements:
            await self.db.refresh(ag)
        return new_agreements, tenant_public_ids
