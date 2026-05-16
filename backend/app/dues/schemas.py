from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class DueGenerateRequest(BaseModel):
    """Generate a monthly due for a single tenant for the given month/year.

    due_date defaults to the 1st of (month, year) when not supplied.
    """

    month: int = Field(ge=1, le=12)
    year: int = Field(ge=2000, le=2100)
    due_date: date | None = None


class DueAdjustRequest(BaseModel):
    """Adjust an unpaid monthly due. All fields optional — only provided ones change.

    Adjustment is rejected when status != 'unpaid' (i.e. once any payment has been
    recorded, the ledger is frozen for that due). remaining_balance is recomputed
    on the server after total_due/rent_amount changes.
    """

    rent_amount: Decimal | None = Field(None, gt=0)
    total_due: Decimal | None = Field(None, gt=0)
    due_date: date | None = None


class BulkDueGenerateRequest(BaseModel):
    """Generate monthly dues for ALL active tenants for a given month/year.

    due_date defaults to the 1st of (month, year). Skips tenants that
    already have a due for this period (idempotent).
    """

    month: int = Field(ge=1, le=12)
    year: int = Field(ge=2000, le=2100)
    due_date: date | None = None


class BulkDueGenerateResult(BaseModel):
    """Summary after a bulk due generation run."""

    created: int
    skipped: int
    no_agreement: int


class PendingDueCountResult(BaseModel):
    """How many tenants are waiting for dues to be generated."""

    pending: int
    already_has_due: int
    no_agreement: int
    month: int
    year: int


class MonthlyDueResponse(BaseModel):
    public_id: UUID
    tenant_public_id: UUID
    agreement_public_id: UUID
    month: int
    year: int
    rent_amount: Decimal
    total_due: Decimal
    amount_paid: Decimal
    remaining_balance: Decimal
    status: Literal["unpaid", "partial", "paid"]
    is_auto_generated: bool
    due_date: date | None
    is_active: bool
    created_at: datetime
