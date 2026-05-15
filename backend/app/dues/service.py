from datetime import date
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.dues.schemas import DueAdjustRequest, DueGenerateRequest
from app.models.monthly_due import MonthlyDue
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
