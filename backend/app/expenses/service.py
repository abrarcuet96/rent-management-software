from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.expenses.schemas import ExpenseCategoryCreate, ExpenseCreate, ExpenseUpdate
from app.models.expense import Expense
from app.models.expense_category import ExpenseCategory


class ExpenseService:
    def __init__(self, db: AsyncSession, owner_id: UUID) -> None:
        self.db = db
        self.owner_id = owner_id

    # --- Categories ---

    async def list_categories(self, page: int, page_size: int) -> tuple[list[ExpenseCategory], int]:
        raise NotImplementedError

    async def create_category(self, data: ExpenseCategoryCreate) -> ExpenseCategory:
        raise NotImplementedError

    async def deactivate_category(self, public_id: UUID) -> None:
        """Soft-delete a category. Raises 403 if is_default=True."""
        raise NotImplementedError

    # --- Expenses ---

    async def list_expenses(
        self,
        building_public_id: UUID | None,
        apartment_public_id: UUID | None,
        page: int,
        page_size: int,
    ) -> tuple[list[Expense], int]:
        raise NotImplementedError

    async def get_expense(self, public_id: UUID) -> Expense:
        raise NotImplementedError

    async def create_expense(self, data: ExpenseCreate) -> Expense:
        raise NotImplementedError

    async def update_expense(self, public_id: UUID, data: ExpenseUpdate) -> Expense:
        raise NotImplementedError

    async def deactivate_expense(self, public_id: UUID) -> None:
        raise NotImplementedError
