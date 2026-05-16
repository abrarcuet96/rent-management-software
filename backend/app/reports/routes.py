from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.reports.service import ReportService
from app.shared.dependencies import get_current_owner
from app.shared.schemas import PaginatedResponse, PaginationMeta, StandardResponse

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/payment-history", response_model=PaginatedResponse)
async def payment_history(
    tenant_public_id: UUID = Query(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> PaginatedResponse:
    service = ReportService(db, owner_id)
    items, total = await service.payment_history(tenant_public_id, page, page_size)
    return PaginatedResponse(
        success=True,
        data=items,
        pagination=PaginationMeta(page=page, page_size=page_size, total=total),
    )


@router.get("/annual-summary", response_model=StandardResponse)
async def annual_summary(
    year: int = Query(..., ge=2000, le=2100),
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> StandardResponse:
    service = ReportService(db, owner_id)
    data = await service.annual_summary(year)
    return StandardResponse(success=True, data=data)


@router.get("/overdue-list", response_model=StandardResponse)
async def overdue_list(
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> StandardResponse:
    service = ReportService(db, owner_id)
    items = await service.overdue_list()
    return StandardResponse(success=True, data=items)
