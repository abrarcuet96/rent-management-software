from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.expenses.schemas import (
    ExpenseCategoryCreate,
    ExpenseCategoryResponse,
    ExpenseCreate,
    ExpenseResponse,
    ExpenseUpdate,
)
from app.expenses.service import ExpenseService
from app.shared.dependencies import get_current_owner
from app.shared.schemas import PaginatedResponse, PaginationMeta, StandardResponse

router = APIRouter(tags=["expenses"])


# ── Expense Categories ──────────────────────────────────────────────────────


@router.get("/expense-categories", response_model=PaginatedResponse)
async def list_categories(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> PaginatedResponse:
    service = ExpenseService(db, owner_id)
    categories, total = await service.list_categories(page, page_size)
    return PaginatedResponse(
        success=True,
        data=[
            ExpenseCategoryResponse(public_id=c.public_id, name=c.name, is_default=c.is_default)
            for c in categories
        ],
        pagination=PaginationMeta(page=page, page_size=page_size, total=total),
    )


@router.post(
    "/expense-categories", response_model=StandardResponse, status_code=status.HTTP_201_CREATED
)
async def create_category(
    body: ExpenseCategoryCreate,
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> StandardResponse:
    service = ExpenseService(db, owner_id)
    cat = await service.create_category(body)
    return StandardResponse(
        success=True,
        data=ExpenseCategoryResponse(
            public_id=cat.public_id, name=cat.name, is_default=cat.is_default
        ),
        message="Category created",
    )


@router.delete("/expense-categories/{public_id}", response_model=StandardResponse)
async def delete_category(
    public_id: UUID,
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> StandardResponse:
    service = ExpenseService(db, owner_id)
    await service.deactivate_category(public_id)
    return StandardResponse(success=True, message="Category deactivated")


# ── Expenses ────────────────────────────────────────────────────────────────


def _expense_to_response(e: object) -> ExpenseResponse:
    return ExpenseResponse(
        public_id=e.public_id,
        category_public_id=e.category.public_id,
        building_public_id=e.building.public_id if e.building else None,
        apartment_public_id=e.apartment.public_id if e.apartment else None,
        description=e.description,
        amount=e.amount,
        expense_date=str(e.expense_date),
        is_tenant_charged=e.is_tenant_charged,
    )


@router.get("/expenses", response_model=PaginatedResponse)
async def list_expenses(
    building_id: UUID | None = Query(None),
    apartment_id: UUID | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> PaginatedResponse:
    service = ExpenseService(db, owner_id)
    expenses, total = await service.list_expenses(building_id, apartment_id, page, page_size)
    return PaginatedResponse(
        success=True,
        data=[_expense_to_response(e) for e in expenses],
        pagination=PaginationMeta(page=page, page_size=page_size, total=total),
    )


@router.post("/expenses", response_model=StandardResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    body: ExpenseCreate,
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> StandardResponse:
    service = ExpenseService(db, owner_id)
    expense = await service.create_expense(body)
    return StandardResponse(
        success=True, data=_expense_to_response(expense), message="Expense created"
    )


@router.get("/expenses/{public_id}", response_model=StandardResponse)
async def get_expense(
    public_id: UUID,
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> StandardResponse:
    service = ExpenseService(db, owner_id)
    expense = await service.get_expense(public_id)
    return StandardResponse(success=True, data=_expense_to_response(expense))


@router.put("/expenses/{public_id}", response_model=StandardResponse)
async def update_expense(
    public_id: UUID,
    body: ExpenseUpdate,
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> StandardResponse:
    service = ExpenseService(db, owner_id)
    expense = await service.update_expense(public_id, body)
    return StandardResponse(
        success=True, data=_expense_to_response(expense), message="Expense updated"
    )


@router.delete("/expenses/{public_id}", response_model=StandardResponse)
async def delete_expense(
    public_id: UUID,
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> StandardResponse:
    service = ExpenseService(db, owner_id)
    await service.deactivate_expense(public_id)
    return StandardResponse(success=True, message="Expense deactivated")
