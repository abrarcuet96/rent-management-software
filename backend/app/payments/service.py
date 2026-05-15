from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.monthly_due import MonthlyDue
from app.models.payment_record import PaymentRecord
from app.payments.schemas import BulkPaymentRequest, PaymentCreate
from app.shared.ownership import resolve_due, resolve_tenant_id


class PaymentService:
    def __init__(self, db: AsyncSession, owner_id: UUID) -> None:
        self.db = db
        self.owner_id = owner_id

    @staticmethod
    def _new_status(remaining: Decimal) -> str:
        """Decide the post-payment status from the new remaining_balance.

        unpaid → partial → paid; never backwards (we only get here on apply).
        """
        return "paid" if remaining == Decimal("0") else "partial"

    async def record_payment(
        self,
        due_public_id: UUID,
        data: PaymentCreate,
    ) -> tuple[PaymentRecord, MonthlyDue]:
        """Apply a single payment to a specific due, atomically updating the ledger.

        Refuses overpayment (amount > remaining_balance) with 400 — we never allow
        a due to go into a negative balance. Returns the new PaymentRecord and the
        post-update MonthlyDue so the caller can return both in the response.
        """
        due = await resolve_due(self.db, self.owner_id, due_public_id)

        if due.status == "paid":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Due is already fully paid",
            )
        if data.amount > due.remaining_balance:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Payment amount {data.amount} exceeds remaining balance "
                    f"{due.remaining_balance}"
                ),
            )

        payment = PaymentRecord(
            due_id=due.id,
            amount_paid=data.amount,
            paid_on=data.paid_on,
            note=data.note,
        )
        self.db.add(payment)

        due.amount_paid = due.amount_paid + data.amount
        due.remaining_balance = due.remaining_balance - data.amount
        due.status = self._new_status(due.remaining_balance)

        await self.db.commit()
        await self.db.refresh(payment)
        await self.db.refresh(due)
        return payment, due

    async def record_bulk_payment(
        self,
        data: BulkPaymentRequest,
    ) -> tuple[list[PaymentRecord], list[MonthlyDue], Decimal]:
        """Distribute total_amount across the tenant's open dues, oldest first.

        Walks unpaid+partial dues in (year asc, month asc) order, applying
        min(remaining_balance, remaining_total) to each and stopping when
        the lump sum is exhausted. Returns the list of new payment records
        (one per due touched), the list of updated dues in the same order,
        and any unapplied remainder.
        """
        tenant_id = await resolve_tenant_id(self.db, self.owner_id, data.tenant_public_id)

        result = await self.db.execute(
            select(MonthlyDue)
            .where(
                MonthlyDue.tenant_id == tenant_id,
                MonthlyDue.is_active.is_(True),
                MonthlyDue.status.in_(("unpaid", "partial")),
            )
            .order_by(MonthlyDue.year.asc(), MonthlyDue.month.asc())
        )
        open_dues = list(result.scalars().all())

        if not open_dues:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tenant has no unpaid or partial dues",
            )

        remaining_total = data.total_amount
        new_payments: list[PaymentRecord] = []
        updated_dues: list[MonthlyDue] = []

        for due in open_dues:
            if remaining_total <= Decimal("0"):
                break
            apply = min(due.remaining_balance, remaining_total)

            payment = PaymentRecord(
                due_id=due.id,
                amount_paid=apply,
                paid_on=data.paid_on,
                note=data.note,
            )
            self.db.add(payment)

            due.amount_paid = due.amount_paid + apply
            due.remaining_balance = due.remaining_balance - apply
            due.status = self._new_status(due.remaining_balance)

            new_payments.append(payment)
            updated_dues.append(due)
            remaining_total -= apply

        await self.db.commit()
        for p in new_payments:
            await self.db.refresh(p)
        for d in updated_dues:
            await self.db.refresh(d)
        return new_payments, updated_dues, remaining_total

    async def list_payments(
        self,
        due_public_id: UUID,
        page: int,
        page_size: int,
    ) -> tuple[list[PaymentRecord], int]:
        """Return active payment records for a due, newest first."""
        due = await resolve_due(self.db, self.owner_id, due_public_id)
        conditions = [
            PaymentRecord.due_id == due.id,
            PaymentRecord.is_active.is_(True),
        ]
        total = await self.db.scalar(
            select(func.count()).select_from(PaymentRecord).where(*conditions)
        )
        offset = (page - 1) * page_size
        result = await self.db.execute(
            select(PaymentRecord)
            .where(*conditions)
            .order_by(PaymentRecord.paid_on.desc(), PaymentRecord.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        return list(result.scalars().all()), total or 0
