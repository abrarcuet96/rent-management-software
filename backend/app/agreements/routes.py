from uuid import UUID

from fastapi import APIRouter, Depends
from fastapi import status as http_status
from sqlalchemy.ext.asyncio import AsyncSession

from app.agreements.schemas import (
    AgreementCreate,
    AgreementResponse,
    BulkRentAdjustRequest,
    BulkRentAdjustResult,
)
from app.agreements.service import AgreementService
from app.core.database import get_db
from app.models.tenant_agreement import TenantAgreement
from app.shared.dependencies import get_current_owner
from app.shared.schemas import StandardResponse

# No global prefix — this module owns paths on two different roots:
#   /tenants/{tenant_public_id}/agreements
#   /agreements/bulk-adjust
router = APIRouter(tags=["agreements"])


def _to_response(agreement: TenantAgreement, tenant_public_id: UUID) -> AgreementResponse:
    return AgreementResponse(
        public_id=agreement.public_id,
        tenant_public_id=tenant_public_id,
        rent_amount=agreement.rent_amount,
        start_date=agreement.start_date,
        end_date=agreement.end_date,
        is_active=agreement.is_active,
        created_at=agreement.created_at,
    )


@router.get("/tenants/{tenant_public_id}/agreements", response_model=StandardResponse)
async def list_agreements(
    tenant_public_id: UUID,
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> StandardResponse:
    service = AgreementService(db, owner_id)
    agreements = await service.list_agreements(tenant_public_id)
    return StandardResponse(
        success=True,
        data=[_to_response(a, tenant_public_id) for a in agreements],
    )


@router.post(
    "/tenants/{tenant_public_id}/agreements",
    response_model=StandardResponse,
    status_code=http_status.HTTP_201_CREATED,
)
async def create_agreement(
    tenant_public_id: UUID,
    body: AgreementCreate,
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> StandardResponse:
    service = AgreementService(db, owner_id)
    agreement = await service.create_agreement(tenant_public_id, body)
    return StandardResponse(
        success=True,
        data=_to_response(agreement, tenant_public_id),
        message="Agreement created",
    )


@router.post(
    "/agreements/bulk-adjust",
    response_model=StandardResponse,
    status_code=http_status.HTTP_201_CREATED,
)
async def bulk_adjust_rent(
    body: BulkRentAdjustRequest,
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> StandardResponse:
    service = AgreementService(db, owner_id)
    new_agreements, tenant_public_ids = await service.bulk_adjust_rent(body)
    result = BulkRentAdjustResult(
        tenants_adjusted=len(new_agreements),
        new_agreements=[
            _to_response(ag, tpid) for ag, tpid in zip(new_agreements, tenant_public_ids)
        ],
    )
    return StandardResponse(success=True, data=result, message="Bulk rent adjustment applied")
