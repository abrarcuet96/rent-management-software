from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class ExpenseCategoryCreate(BaseModel):
    name: str


class ExpenseCategoryResponse(BaseModel):
    public_id: UUID
    name: str
    is_default: bool


class ExpenseCreate(BaseModel):
    category_public_id: UUID
    building_public_id: UUID | None = None
    apartment_public_id: UUID | None = None
    description: str
    amount: Decimal
    expense_date: str  # YYYY-MM-DD
    is_tenant_charged: bool = False


class ExpenseUpdate(BaseModel):
    description: str | None = None
    amount: Decimal | None = None
    expense_date: str | None = None
    is_tenant_charged: bool | None = None


class ChargeTenantsRequest(BaseModel):
    tenant_public_ids: list[UUID]


class ChargeTenantsResponse(BaseModel):
    charged: int
    skipped: int


class ExpenseResponse(BaseModel):
    public_id: UUID
    category_public_id: UUID
    building_public_id: UUID | None
    apartment_public_id: UUID | None
    description: str
    amount: Decimal
    expense_date: str
    is_tenant_charged: bool
    charged_tenant_public_ids: list[UUID] = []
