from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.apartment import Apartment
from app.models.building import Building
from app.models.expense import Expense
from app.models.monthly_due import MonthlyDue
from app.models.payment_record import PaymentRecord
from app.models.tenant import Tenant


class DashboardService:
    def __init__(self, db: AsyncSession, owner_id: UUID) -> None:
        self.db = db
        self.owner_id = owner_id

    async def get_summary(self, month: int | None = None, year: int | None = None) -> dict:
        """Return the owner's portfolio summary for the given (or current) month.

        Numbers returned:
          - total_collected: sum of PaymentRecord.amount_paid where paid_on falls
            in (month, year) AND the payment belongs to one of this owner's tenants.
          - total_outstanding: sum of MonthlyDue.remaining_balance across all open
            dues (unpaid/partial) for this owner — *not* limited to (month, year)
            because outstanding rolls forward.
          - vacant/occupied_apartments: live counts across the owner's buildings.
          - total_expenses: sum of Expense.amount where expense_date falls in
            (month, year) AND is_tenant_charged=False (owner cost, not pass-through).
          - net_profit: total_collected - total_expenses.
        """
        today = date.today()
        m = month if month is not None else today.month
        y = year if year is not None else today.year

        # 1. total_collected for (m, y): join PaymentRecord → MonthlyDue → Tenant → Apt → Building (owner)
        collected_q = (
            select(func.coalesce(func.sum(PaymentRecord.amount_paid), 0))
            .select_from(PaymentRecord)
            .join(MonthlyDue, MonthlyDue.id == PaymentRecord.due_id)
            .join(Tenant, Tenant.id == MonthlyDue.tenant_id)
            .join(Apartment, Apartment.id == Tenant.apartment_id)
            .join(Building, Building.id == Apartment.building_id)
            .where(
                PaymentRecord.is_active.is_(True),
                Building.owner_id == self.owner_id,
                extract("month", PaymentRecord.paid_on) == m,
                extract("year", PaymentRecord.paid_on) == y,
            )
        )
        total_collected: Decimal = await self.db.scalar(collected_q) or Decimal("0")

        # 2. total_outstanding across all open dues for the owner (not limited to month)
        outstanding_q = (
            select(func.coalesce(func.sum(MonthlyDue.remaining_balance), 0))
            .select_from(MonthlyDue)
            .join(Tenant, Tenant.id == MonthlyDue.tenant_id)
            .join(Apartment, Apartment.id == Tenant.apartment_id)
            .join(Building, Building.id == Apartment.building_id)
            .where(
                MonthlyDue.is_active.is_(True),
                MonthlyDue.status.in_(("unpaid", "partial")),
                Building.owner_id == self.owner_id,
            )
        )
        total_outstanding: Decimal = await self.db.scalar(outstanding_q) or Decimal("0")

        # 3. apartment occupancy counts
        apt_status_q = (
            select(Apartment.status, func.count(Apartment.id))
            .join(Building, Building.id == Apartment.building_id)
            .where(
                Apartment.is_active.is_(True),
                Building.owner_id == self.owner_id,
                Building.is_active.is_(True),
            )
            .group_by(Apartment.status)
        )
        rows = (await self.db.execute(apt_status_q)).all()
        counts = {s: int(c) for s, c in rows}
        vacant_apartments = counts.get("vacant", 0)
        occupied_apartments = counts.get("occupied", 0)

        # 4. owner-borne expenses for the month
        expenses_q = select(func.coalesce(func.sum(Expense.amount), 0)).where(
            Expense.owner_id == self.owner_id,
            Expense.is_active.is_(True),
            Expense.is_tenant_charged.is_(False),
            extract("month", Expense.expense_date) == m,
            extract("year", Expense.expense_date) == y,
        )
        total_expenses: Decimal = await self.db.scalar(expenses_q) or Decimal("0")

        net_profit = total_collected - total_expenses

        return {
            "month": m,
            "year": y,
            "total_collected": total_collected,
            "total_outstanding": total_outstanding,
            "vacant_apartments": vacant_apartments,
            "occupied_apartments": occupied_apartments,
            "total_apartments": vacant_apartments + occupied_apartments,
            "total_expenses": total_expenses,
            "net_profit": net_profit,
        }
