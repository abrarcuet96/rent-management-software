from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dashboard.service import DashboardService
from app.shared.dependencies import get_current_owner
from app.shared.schemas import StandardResponse

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=StandardResponse)
async def dashboard_summary(
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None, ge=2000, le=2100),
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> StandardResponse:
    service = DashboardService(db, owner_id)
    data = await service.get_summary(month, year)
    return StandardResponse(success=True, data=data)
