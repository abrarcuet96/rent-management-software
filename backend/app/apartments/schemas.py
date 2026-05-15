from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class ApartmentCreate(BaseModel):
    unit_number: str = Field(min_length=1, max_length=50)
    floor: int = Field(ge=1)
    status: Literal["vacant", "occupied"] = "vacant"


class ApartmentUpdate(BaseModel):
    unit_number: str | None = Field(None, max_length=50)
    floor: int | None = Field(None, ge=1)
    status: Literal["vacant", "occupied"] | None = None


class ApartmentResponse(BaseModel):
    public_id: UUID
    building_public_id: UUID
    unit_number: str
    floor: int
    status: str
    is_active: bool
    created_at: datetime
