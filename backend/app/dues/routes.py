from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi import status as http_status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dues.schemas import DueAdjustRequest, DueGenerateRequest, MonthlyDueResponse
from app.dues.service import DueService
from app.models.monthly_due import MonthlyDue
from app.models.tenant import Tenant
from app.models.tenant_agreement import TenantAgreement
from app.shared.dependencies import get_current_owner
from app.shared.schemas import PaginatedResponse, PaginationMeta, StandardResponse

router = APIRouter(tags=["dues"])


async def _due_response(due: MonthlyDue, db: AsyncSession) -> MonthlyDueResponse:
    """Build a MonthlyDueResponse, resolving the public_ids of tenant and agreement.

    Public_ids aren't on the MonthlyDue row directly, so we do one extra
    round-trip. Cheap on indexed PK lookups.
    """
    row = await db.execute(
        select(Tenant.public_id, TenantAgreement.public_id)
        .join(TenantAgreement, TenantAgreement.id == due.agreement_id)
        .where(Tenant.id == due.tenant_id)
    )
    tenant_pid, agreement_pid = row.one()
    return MonthlyDueResponse(
        public_id=due.public_id,
        tenant_public_id=tenant_pid,
        agreement_public_id=agreement_pid,
        month=due.month,
        year=due.year,
        rent_amount=due.rent_amount,
        total_due=due.total_due,
        amount_paid=due.amount_paid,
        remaining_balance=due.remaining_balance,
        status=due.status,
        is_auto_generated=due.is_auto_generated,
        due_date=due.due_date,
        is_active=due.is_active,
        created_at=due.created_at,
    )


@router.post(
    "/tenants/{tenant_public_id}/dues/generate",
    response_model=StandardResponse,
    status_code=http_status.HTTP_201_CREATED,
)
async def generate_due(
    tenant_public_id: UUID,
    body: DueGenerateRequest,
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> StandardResponse:
    service = DueService(db, owner_id)
    due = await service.generate_due(tenant_public_id, body)
    return StandardResponse(
        success=True,
        data=await _due_response(due, db),
        message="Due generated",
    )


@router.get("/tenants/{tenant_public_id}/dues", response_model=PaginatedResponse)
async def list_dues(
    tenant_public_id: UUID,
    status: str | None = Query(None, pattern="^(unpaid|partial|paid)$"),
    year: int | None = Query(None, ge=2000, le=2100),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> PaginatedResponse:
    service = DueService(db, owner_id)
    dues, total = await service.list_dues(tenant_public_id, status, year, page, page_size)
    items = [await _due_response(d, db) for d in dues]
    return PaginatedResponse(
        success=True,
        data=items,
        pagination=PaginationMeta(page=page, page_size=page_size, total=total),
    )


@router.put("/dues/{due_public_id}", response_model=StandardResponse)
async def adjust_due(
    due_public_id: UUID,
    body: DueAdjustRequest,
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> StandardResponse:
    service = DueService(db, owner_id)
    due = await service.adjust_due(due_public_id, body)
    return StandardResponse(
        success=True,
        data=await _due_response(due, db),
        message="Due adjusted",
    )
