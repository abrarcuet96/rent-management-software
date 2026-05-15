from datetime import date
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.apartment import Apartment
from app.models.building import Building
from app.models.monthly_due import MonthlyDue
from app.models.payment_record import PaymentRecord
from app.models.tenant import Tenant
from app.shared.ownership import resolve_tenant_id


class ReportService:
    def __init__(self, db: AsyncSession, owner_id: UUID) -> None:
        self.db = db
        self.owner_id = owner_id

    async def payment_history(
        self,
        tenant_public_id: UUID,
        page: int,
        page_size: int,
    ) -> tuple[list[dict], int]:
        """Full payment ledger for one tenant: every due + the payments against it.

        Returned ordering: newest year/month first. Payments within a due are
        ordered by paid_on desc. Includes inactive (moved-out) tenants so the
        history of past tenants can still be audited.
        """
        tenant_id = await resolve_tenant_id(
            self.db, self.owner_id, tenant_public_id, require_active=False
        )

        total = await self.db.scalar(
            select(func.count())
            .select_from(MonthlyDue)
            .where(MonthlyDue.tenant_id == tenant_id, MonthlyDue.is_active.is_(True))
        )

        offset = (page - 1) * page_size
        dues_result = await self.db.execute(
            select(MonthlyDue)
            .where(MonthlyDue.tenant_id == tenant_id, MonthlyDue.is_active.is_(True))
            .order_by(MonthlyDue.year.desc(), MonthlyDue.month.desc())
            .offset(offset)
            .limit(page_size)
        )
        dues = list(dues_result.scalars().all())

        items: list[dict] = []
        for due in dues:
            payments_result = await self.db.execute(
                select(PaymentRecord)
                .where(
                    PaymentRecord.due_id == due.id,
                    PaymentRecord.is_active.is_(True),
                )
                .order_by(PaymentRecord.paid_on.desc(), PaymentRecord.created_at.desc())
            )
            payments = [
                {
                    "public_id": p.public_id,
                    "due_public_id": due.public_id,
                    "amount_paid": p.amount_paid,
                    "paid_on": p.paid_on,
                    "note": p.note,
                    "is_active": p.is_active,
                    "created_at": p.created_at,
                }
                for p in payments_result.scalars().all()
            ]
            items.append(
                {
                    "due_public_id": due.public_id,
                    "month": due.month,
                    "year": due.year,
                    "rent_amount": due.rent_amount,
                    "total_due": due.total_due,
                    "amount_paid": due.amount_paid,
                    "remaining_balance": due.remaining_balance,
                    "status": due.status,
                    "due_date": due.due_date,
                    "payments": payments,
                }
            )

        return items, int(total or 0)

    async def overdue_list(self) -> list[dict]:
        """Every unpaid/partial due past its due_date, across every tenant of this owner.

        One row per overdue due (not per tenant) so the UI can render a flat
        actionable list. Includes tenant name + apartment unit + building name
        so the table is meaningful without follow-up lookups.
        """
        today = date.today()
        result = await self.db.execute(
            select(
                MonthlyDue.public_id,
                MonthlyDue.month,
                MonthlyDue.year,
                MonthlyDue.due_date,
                MonthlyDue.remaining_balance,
                MonthlyDue.status,
                Tenant.public_id,
                Tenant.full_name,
                Apartment.unit_number,
                Building.name,
            )
            .join(Tenant, Tenant.id == MonthlyDue.tenant_id)
            .join(Apartment, Apartment.id == Tenant.apartment_id)
            .join(Building, Building.id == Apartment.building_id)
            .where(
                MonthlyDue.is_active.is_(True),
                MonthlyDue.status.in_(("unpaid", "partial")),
                MonthlyDue.due_date.isnot(None),
                MonthlyDue.due_date < today,
                Building.owner_id == self.owner_id,
                Building.is_active.is_(True),
            )
            .order_by(MonthlyDue.due_date.asc())
        )

        return [
            {
                "due_public_id": due_pid,
                "month": m,
                "year": y,
                "due_date": dd,
                "remaining_balance": rb,
                "status": st,
                "tenant_public_id": t_pid,
                "tenant_name": t_name,
                "apartment_unit": unit,
                "building_name": bname,
                "days_overdue": (today - dd).days,
            }
            for (due_pid, m, y, dd, rb, st, t_pid, t_name, unit, bname) in result.all()
        ]
