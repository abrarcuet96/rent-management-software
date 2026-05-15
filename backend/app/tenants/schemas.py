from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class TenantCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    phone: str = Field(min_length=7, max_length=20)
    nid_number: str | None = Field(None, max_length=50)
    address: str | None = None
    member_count: int = Field(ge=1, default=1)
    move_in_date: date
    initial_rent_amount: Decimal = Field(gt=0)
    agreement_start_date: date


class TenantUpdate(BaseModel):
    full_name: str | None = Field(None, max_length=255)
    phone: str | None = Field(None, max_length=20)
    nid_number: str | None = Field(None, max_length=50)
    address: str | None = None
    member_count: int | None = Field(None, ge=1)


class TenantMoveOutRequest(BaseModel):
    move_out_date: date


class TenantResponse(BaseModel):
    public_id: UUID
    apartment_public_id: UUID
    full_name: str
    phone: str
    nid_number: str | None
    address: str | None
    member_count: int
    move_in_date: date
    move_out_date: date | None
    is_active: bool
    created_at: datetime
