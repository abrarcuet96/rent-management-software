from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class AgreementCreate(BaseModel):
    """Create a new agreement for a tenant (typically used for rent changes).

    Creating a new agreement automatically closes the current active agreement
    (end_date = start_date - 1 day, is_active = false).
    """

    rent_amount: Decimal = Field(gt=0)
    start_date: date


class AgreementResponse(BaseModel):
    public_id: UUID
    tenant_public_id: UUID
    rent_amount: Decimal
    start_date: date
    end_date: date | None
    is_active: bool
    created_at: datetime


class BulkRentAdjustRequest(BaseModel):
    """Apply a rent adjustment across many tenants in a single transaction.

    - scope="all": every active tenant the owner has
    - scope="building": every active tenant in one specified building

    adjustment_type="fixed": new_rent = old_rent + amount (amount may be negative)
    adjustment_type="percentage": new_rent = old_rent * (1 + amount/100)
    """

    adjustment_type: Literal["fixed", "percentage"]
    amount: Decimal
    scope: Literal["all", "building"]
    building_public_id: UUID | None = None
    effective_date: date

    @model_validator(mode="after")
    def _check_building_when_scoped(self) -> "BulkRentAdjustRequest":
        if self.scope == "building" and self.building_public_id is None:
            raise ValueError("building_public_id is required when scope='building'")
        if self.scope == "all" and self.building_public_id is not None:
            raise ValueError("building_public_id must not be set when scope='all'")
        return self


class BulkRentAdjustResult(BaseModel):
    tenants_adjusted: int
    new_agreements: list[AgreementResponse]
