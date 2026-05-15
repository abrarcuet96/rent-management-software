from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class BuildingCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    address: str
    total_floors: int = Field(ge=1)


class BuildingUpdate(BaseModel):
    name: str | None = Field(None, max_length=255)
    address: str | None = None
    total_floors: int | None = Field(None, ge=1)


class BuildingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    public_id: UUID
    name: str
    address: str
    total_floors: int
    is_active: bool
    created_at: datetime
