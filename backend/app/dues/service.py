from datetime import date
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import and_, exists, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.dues.schemas import (
    BulkDueGenerateRequest,
    BulkDueGenerateResult,
    DueAdjustRequest,
    DueGenerateRequest,
    PendingDueCountResult,
)
from app.models.apartment import Apartment
from app.models.building import Building
from app.models.monthly_due import MonthlyDue
from app.models.tenant import Tenant
from app.models.tenant_agreement import TenantAgreement
from app.shared.ownership import resolve_due, resolve_tenant_id


class DueService:
    def __init__(self, db: AsyncSession, owner_id: UUID) -> None:
        self.db = db
        self.owner_id = owner_id

    async def _active_agreement(self, tenant_id: UUID) -> TenantAgreement:
        """Return the tenant's current active agreement (is_active AND end_date IS NULL).

        Raises 400 if no active agreement exists — generating a due without one
        would have to invent a rent_amount, which we refuse to do.
        """
        result = await self.db.execute(
            select(TenantAgreement).where(
                TenantAgreement.tenant_id == tenant_id,
                TenantAgreement.is_active.is_(True),
                TenantAgreement.end_date.is_(None),
            )
        )
        agreement = result.scalar_one_or_none()
        if agreement is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active rent agreement for this tenant",
            )
        return agreement

    async def generate_due(self, tenant_public_id: UUID, data: DueGenerateRequest) -> MonthlyDue:
        """Snapshot the active agreement's rent_amount into a MonthlyDue for (month, year).

        Snapshotting at generation time gives us historical accuracy: future rent
        changes don't retroactively alter past dues. The (tenant_id, month, year)
        unique constraint blocks duplicate generation — surfaced as 400.
        """
        tenant_id = await resolve_tenant_id(self.db, self.owner_id, tenant_public_id)
        agreement = await self._active_agreement(tenant_id)

        due_date = data.due_date if data.due_date is not None else date(data.year, data.month, 1)
        rent_amount: Decimal = agreement.rent_amount

        due = MonthlyDue(
            tenant_id=tenant_id,
            agreement_id=agreement.id,
            month=data.month,
            year=data.year,
            rent_amount=rent_amount,
            total_due=rent_amount,
            amount_paid=Decimal("0"),
            remaining_balance=rent_amount,
            status="unpaid",
            is_auto_generated=True,
            due_date=due_date,
        )
        self.db.add(due)
        try:
            await self.db.commit()
        except IntegrityError:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A due for {data.month}/{data.year} already exists for this tenant",
            )
        await self.db.refresh(due)
        return due

    async def list_dues(
        self,
        tenant_public_id: UUID,
        status_filter: str | None,
        year_filter: int | None,
        page: int,
        page_size: int,
    ) -> tuple[list[MonthlyDue], int]:
        """List dues for a tenant, newest year/month first."""
        tenant_id = await resolve_tenant_id(
            self.db, self.owner_id, tenant_public_id, require_active=False
        )
        conditions = [
            MonthlyDue.tenant_id == tenant_id,
            MonthlyDue.is_active.is_(True),
        ]
        if status_filter is not None:
            conditions.append(MonthlyDue.status == status_filter)
        if year_filter is not None:
            conditions.append(MonthlyDue.year == year_filter)

        total = await self.db.scalar(
            select(func.count()).select_from(MonthlyDue).where(*conditions)
        )
        offset = (page - 1) * page_size
        result = await self.db.execute(
            select(MonthlyDue)
            .where(*conditions)
            .order_by(MonthlyDue.year.desc(), MonthlyDue.month.desc())
            .offset(offset)
            .limit(page_size)
        )
        return list(result.scalars().all()), total or 0

    async def get_due(self, due_public_id: UUID) -> MonthlyDue:
        return await resolve_due(self.db, self.owner_id, due_public_id)

    async def adjust_due(self, due_public_id: UUID, data: DueAdjustRequest) -> MonthlyDue:
        """Modify an unpaid due's amounts/due_date.

        Refuses adjustment once payment has been recorded (status != 'unpaid')
        because retroactively changing total_due after partial payment would
        require deciding whether to refund, re-bill, or shift the ledger —
        all of which are explicit business decisions that belong elsewhere.
        """
        due = await resolve_due(self.db, self.owner_id, due_public_id)
        if due.status != "unpaid":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot adjust a {due.status} due — only unpaid dues can be adjusted",
            )

        update_fields = data.model_dump(exclude_unset=True)
        for field, value in update_fields.items():
            setattr(due, field, value)

        # Re-derive remaining_balance against the (possibly new) total_due. For an
        # unpaid due amount_paid is always 0, but keep the formula explicit.
        due.remaining_balance = due.total_due - due.amount_paid

        await self.db.commit()
        await self.db.refresh(due)
        return due

    async def get_pending_due_count(self, month: int, year: int) -> PendingDueCountResult:
        """Count how many active tenants still need dues for (month, year).

        Returns counts broken down as:
          - pending: tenants with active agreements but no due for this period
          - already_has_due: tenants that already have a due for this period
          - no_agreement: active tenants without an active agreement
        """
        # Subquery: which tenants already have a due for (month, year)
        due_subq = select(MonthlyDue.id).where(
            MonthlyDue.tenant_id == Tenant.id,
            MonthlyDue.month == month,
            MonthlyDue.year == year,
            MonthlyDue.is_active.is_(True),
        )

        base_conditions = [
            Tenant.is_active.is_(True),
            Building.owner_id == self.owner_id,
            Building.is_active.is_(True),
        ]

        # Total active tenants (ownership-scoped)
        total_active = (
            await self.db.scalar(
                select(func.count())
                .select_from(Tenant)
                .join(Apartment, Apartment.id == Tenant.apartment_id)
                .join(Building, Building.id == Apartment.building_id)
                .where(*base_conditions)
            )
            or 0
        )

        # Tenants with active agreements
        eligible = (
            await self.db.scalar(
                select(func.count())
                .select_from(Tenant)
                .join(Apartment, Apartment.id == Tenant.apartment_id)
                .join(Building, Building.id == Apartment.building_id)
                .join(
                    TenantAgreement,
                    and_(
                        TenantAgreement.tenant_id == Tenant.id,
                        TenantAgreement.is_active.is_(True),
                        TenantAgreement.end_date.is_(None),
                    ),
                )
                .where(*base_conditions)
            )
            or 0
        )

        # Eligible tenants that already have a due for (month, year)
        already_has_due = (
            await self.db.scalar(
                select(func.count())
                .select_from(Tenant)
                .join(Apartment, Apartment.id == Tenant.apartment_id)
                .join(Building, Building.id == Apartment.building_id)
                .join(
                    TenantAgreement,
                    and_(
                        TenantAgreement.tenant_id == Tenant.id,
                        TenantAgreement.is_active.is_(True),
                        TenantAgreement.end_date.is_(None),
                    ),
                )
                .where(*base_conditions, exists(due_subq))
            )
            or 0
        )

        return PendingDueCountResult(
            pending=eligible - already_has_due,
            already_has_due=already_has_due,
            no_agreement=total_active - eligible,
            month=month,
            year=year,
        )

    async def generate_bulk_dues(self, data: BulkDueGenerateRequest) -> BulkDueGenerateResult:
        """Generate dues for all active tenants that don't already have one.

        Ownership-scoped: only tenants owned by self.owner_id are affected.
        Idempotent by construction — the NOT EXISTS subquery skips tenants
        that already have a due for (month, year).
        """
        due_date = data.due_date if data.due_date is not None else date(data.year, data.month, 1)

        # Count eligible tenants before generation (for the response summary)
        due_subq = select(MonthlyDue.id).where(
            MonthlyDue.tenant_id == Tenant.id,
            MonthlyDue.month == data.month,
            MonthlyDue.year == data.year,
            MonthlyDue.is_active.is_(True),
        )

        base_conditions = [
            Tenant.is_active.is_(True),
            Building.owner_id == self.owner_id,
            Building.is_active.is_(True),
        ]

        total_active = (
            await self.db.scalar(
                select(func.count())
                .select_from(Tenant)
                .join(Apartment, Apartment.id == Tenant.apartment_id)
                .join(Building, Building.id == Apartment.building_id)
                .where(*base_conditions)
            )
            or 0
        )

        already_has_due = (
            await self.db.scalar(
                select(func.count())
                .select_from(Tenant)
                .join(Apartment, Apartment.id == Tenant.apartment_id)
                .join(Building, Building.id == Apartment.building_id)
                .join(
                    TenantAgreement,
                    and_(
                        TenantAgreement.tenant_id == Tenant.id,
                        TenantAgreement.is_active.is_(True),
                        TenantAgreement.end_date.is_(None),
                    ),
                )
                .where(*base_conditions, exists(due_subq))
            )
            or 0
        )

        # Find tenants needing dues: active, with active agreement, without existing due
        result = await self.db.execute(
            select(Tenant.id, TenantAgreement.id, TenantAgreement.rent_amount)
            .join(Apartment, Apartment.id == Tenant.apartment_id)
            .join(Building, Building.id == Apartment.building_id)
            .join(
                TenantAgreement,
                and_(
                    TenantAgreement.tenant_id == Tenant.id,
                    TenantAgreement.is_active.is_(True),
                    TenantAgreement.end_date.is_(None),
                ),
            )
            .where(*base_conditions, ~exists(due_subq))
        )
        rows = result.all()

        created = 0
        for tenant_id, agreement_id, rent_amount in rows:
            due = MonthlyDue(
                tenant_id=tenant_id,
                agreement_id=agreement_id,
                month=data.month,
                year=data.year,
                rent_amount=rent_amount,
                total_due=rent_amount,
                amount_paid=Decimal("0"),
                remaining_balance=rent_amount,
                status="unpaid",
                is_auto_generated=True,
                due_date=due_date,
            )
            self.db.add(due)
            created += 1

        if created > 0:
            await self.db.commit()

        eligible = created + already_has_due
        no_agreement = total_active - eligible

        return BulkDueGenerateResult(
            created=created,
            skipped=already_has_due,
            no_agreement=no_agreement,
        )
