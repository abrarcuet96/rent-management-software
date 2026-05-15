from typing import Any

from pydantic import BaseModel


class StandardResponse(BaseModel):
    success: bool
    data: Any = None
    message: str = ""


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total: int


class PaginatedResponse(BaseModel):
    success: bool
    data: list[Any]
    pagination: PaginationMeta
    message: str = ""


class ErrorDetail(BaseModel):
    field: str | None = None
    message: str
