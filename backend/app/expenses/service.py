from datetime import date
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.expenses.schemas import ExpenseCategoryCreate, ExpenseCreate, ExpenseUpdate
from app.models.due_expense import DueExpense
from app.models.expense import Expense
from app.models.expense_category import ExpenseCategory
from app.models.monthly_due import MonthlyDue
from app.shared.ownership import (
    resolve_apartment_id,
    resolve_building_id,
    resolve_category_id,
    resolve_tenant_id,
)


class ExpenseService:
    def __init__(self, db: AsyncSession, owner_id: UUID) -> None:
        self.db = db
        self.owner_id = owner_id

    # --- Categories ---

    async def list_categories(self, page: int, page_size: int) -> tuple[list[ExpenseCategory], int]:
        conditions = [
            ExpenseCategory.owner_id == self.owner_id,
            ExpenseCategory.is_active.is_(True),
        ]
        total = await self.db.scalar(
            select(func.count()).select_from(ExpenseCategory).where(*conditions)
        )
        offset = (page - 1) * page_size
        result = await self.db.execute(
            select(ExpenseCategory)
            .where(*conditions)
            .order_by(ExpenseCategory.name.asc())
            .offset(offset)
            .limit(page_size)
        )
        return list(result.scalars().all()), total or 0

    async def create_category(self, data: ExpenseCategoryCreate) -> ExpenseCategory:
        # Check for duplicate name (active) for this owner
        existing = await self.db.scalar(
            select(ExpenseCategory.id).where(
                ExpenseCategory.owner_id == self.owner_id,
                ExpenseCategory.name == data.name.strip(),
                ExpenseCategory.is_active.is_(True),
            )
        )
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A category with this name already exists",
            )

        category = ExpenseCategory(
            owner_id=self.owner_id,
            name=data.name.strip(),
        )
        self.db.add(category)
        await self.db.commit()
        await self.db.refresh(category)
        return category

    async def deactivate_category(self, public_id: UUID) -> None:
        cat_id = await resolve_category_id(self.db, self.owner_id, public_id)

        category = await self.db.scalar(select(ExpenseCategory).where(ExpenseCategory.id == cat_id))
        if category is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

        if category.is_default:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Default categories cannot be deactivated",
            )

        # Check for active expenses under this category
        active_expense_count = await self.db.scalar(
            select(func.count())
            .select_from(Expense)
            .where(
                Expense.category_id == cat_id,
                Expense.is_active.is_(True),
            )
        )
        if active_expense_count and active_expense_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot deactivate a category that has active expenses",
            )

        category.is_active = False
        await self.db.commit()

    # --- Expenses ---

    async def list_expenses(
        self,
        building_public_id: UUID | None,
        apartment_public_id: UUID | None,
        page: int,
        page_size: int,
    ) -> tuple[list[Expense], int]:
        conditions = [
            Expense.owner_id == self.owner_id,
            Expense.is_active.is_(True),
        ]

        if building_public_id is not None:
            building_id = await resolve_building_id(self.db, self.owner_id, building_public_id)
            conditions.append(Expense.building_id == building_id)

        if apartment_public_id is not None:
            apt_id = await resolve_apartment_id(self.db, self.owner_id, apartment_public_id)
            conditions.append(Expense.apartment_id == apt_id)

        total = await self.db.scalar(select(func.count()).select_from(Expense).where(*conditions))
        offset = (page - 1) * page_size
        result = await self.db.execute(
            select(Expense)
            .where(*conditions)
            .options(
                selectinload(Expense.category),
                selectinload(Expense.building),
                selectinload(Expense.apartment),
                selectinload(Expense.due_expenses)
                .selectinload(DueExpense.monthly_due)
                .selectinload(MonthlyDue.tenant),
            )
            .order_by(Expense.expense_date.desc(), Expense.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        return list(result.scalars().all()), total or 0

    async def get_expense(self, public_id: UUID) -> Expense:
        result = await self.db.execute(
            select(Expense)
            .where(
                Expense.public_id == public_id,
                Expense.owner_id == self.owner_id,
                Expense.is_active.is_(True),
            )
            .options(
                selectinload(Expense.category),
                selectinload(Expense.building),
                selectinload(Expense.apartment),
                selectinload(Expense.due_expenses)
                .selectinload(DueExpense.monthly_due)
                .selectinload(MonthlyDue.tenant),
            )
        )
        expense = result.scalar_one_or_none()
        if expense is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
        return expense

    async def _resolve_scope_and_ids(
        self,
        building_public_id: UUID | None,
        apartment_public_id: UUID | None,
    ) -> tuple[str, UUID | None, UUID | None]:
        """Determine scope, building_id, apartment_id from public IDs.

        - No building, no apartment → error (must have at least one)
        - Building only → scope='building', resolve building
        - Building + apartment → scope='apartment', resolve both and verify
          apartment belongs to building
        """
        if building_public_id is None and apartment_public_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one of building or apartment must be provided",
            )

        if building_public_id is not None and apartment_public_id is None:
            building_id = await resolve_building_id(self.db, self.owner_id, building_public_id)
            return "building", building_id, None

        if building_public_id is None and apartment_public_id is not None:
            apt_id = await resolve_apartment_id(self.db, self.owner_id, apartment_public_id)
            return "apartment", None, apt_id

        # Both given
        building_id = await resolve_building_id(self.db, self.owner_id, building_public_id)
        apt_id = await resolve_apartment_id(
            self.db, self.owner_id, apartment_public_id, building_id=building_id
        )
        return "apartment", building_id, apt_id

    async def create_expense(self, data: ExpenseCreate) -> Expense:
        category_id = await resolve_category_id(self.db, self.owner_id, data.category_public_id)
        scope, building_id, apt_id = await self._resolve_scope_and_ids(
            data.building_public_id, data.apartment_public_id
        )

        expense = Expense(
            owner_id=self.owner_id,
            category_id=category_id,
            building_id=building_id,
            apartment_id=apt_id,
            description=data.description.strip(),
            amount=data.amount,
            expense_date=date.fromisoformat(data.expense_date),
            scope=scope,
            is_tenant_charged=data.is_tenant_charged,
        )
        self.db.add(expense)
        await self.db.commit()
        await self.db.refresh(expense)

        # Re-fetch with relationships for response
        return await self.get_expense(expense.public_id)

    async def update_expense(self, public_id: UUID, data: ExpenseUpdate) -> Expense:
        expense = await self.get_expense(public_id)

        update_fields = data.model_dump(exclude_unset=True)
        for field, value in update_fields.items():
            if field == "expense_date" and value is not None:
                value = date.fromisoformat(value)
            setattr(expense, field, value)

        await self.db.commit()
        await self.db.refresh(expense)
        return expense

    async def deactivate_expense(self, public_id: UUID) -> None:
        expense = await self.get_expense(public_id)
        expense.is_active = False
        await self.db.commit()

    async def charge_tenants(
        self,
        expense_public_id: UUID,
        tenant_public_ids: list[UUID],
    ) -> tuple[int, int]:
        """Link this expense to each tenant's MonthlyDue for the expense's month/year.

        For each tenant_public_id:
          - Resolves tenant (verifies ownership chain)
          - Finds their MonthlyDue for the same month/year as expense_date
          - Skips if no due exists for that period
          - Skips if already charged (idempotent — same due_id+expense_id pair)
          - Otherwise creates DueExpense and updates the due's totals/status

        Returns (charged_count, skipped_count).
        """
        expense = await self.get_expense(expense_public_id)
        if not expense.is_tenant_charged:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This expense is not marked as tenant-charged",
            )

        month = expense.expense_date.month
        year = expense.expense_date.year
        charged = 0
        skipped = 0

        for tenant_public_id in tenant_public_ids:
            tenant_id = await resolve_tenant_id(
                self.db, self.owner_id, tenant_public_id, require_active=False
            )

            # Find the MonthlyDue for this tenant and expense month/year
            due = await self.db.scalar(
                select(MonthlyDue).where(
                    MonthlyDue.tenant_id == tenant_id,
                    MonthlyDue.month == month,
                    MonthlyDue.year == year,
                    MonthlyDue.is_active.is_(True),
                )
            )
            if due is None:
                skipped += 1
                continue

            # Idempotency: skip if already charged
            existing = await self.db.scalar(
                select(DueExpense.id).where(
                    DueExpense.due_id == due.id,
                    DueExpense.expense_id == expense.id,
                )
            )
            if existing is not None:
                skipped += 1
                continue

            # Create the DueExpense junction row
            due_expense_row = DueExpense(
                due_id=due.id,
                expense_id=expense.id,
                charged_amount=expense.amount,
            )
            self.db.add(due_expense_row)

            # Update MonthlyDue ledger
            due.total_due += expense.amount
            due.remaining_balance += expense.amount
            # Recalculate status
            if due.remaining_balance == Decimal("0"):
                due.status = "paid"
            elif due.amount_paid > Decimal("0"):
                due.status = "partial"
            else:
                due.status = "unpaid"

            charged += 1

        if charged > 0:
            await self.db.commit()

        return charged, skipped
