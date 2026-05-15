from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class PaymentCreate(BaseModel):
    """Record a single payment against one MonthlyDue.

    amount must be > 0 and must not exceed the due's remaining_balance.
    """

    amount: Decimal = Field(gt=0)
    paid_on: date
    note: str | None = None


class BulkPaymentRequest(BaseModel):
    """Lump-sum payment to be distributed oldest-due-first across a tenant's open dues.

    Stops applying when total_amount is exhausted or no more unpaid/partial dues
    remain. Any unapplied remainder is returned in BulkPaymentResult.unapplied.
    """

    tenant_public_id: UUID
    total_amount: Decimal = Field(gt=0)
    paid_on: date
    note: str | None = None


class PaymentRecordResponse(BaseModel):
    public_id: UUID
    due_public_id: UUID
    amount_paid: Decimal
    paid_on: date
    note: str | None
    is_active: bool
    created_at: datetime


class BulkPaymentDueUpdate(BaseModel):
    due_public_id: UUID
    month: int
    year: int
    applied_amount: Decimal
    new_status: Literal["partial", "paid"]


class BulkPaymentResult(BaseModel):
    total_applied: Decimal
    unapplied: Decimal
    dues_cleared: int
    dues_partially_paid: int
    dues_updated: list[BulkPaymentDueUpdate]
    payment_records: list[PaymentRecordResponse]
