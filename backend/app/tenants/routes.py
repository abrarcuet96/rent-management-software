from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi import status as http_status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.apartment import Apartment
from app.models.building import Building
from app.models.tenant import Tenant
from app.shared.dependencies import get_current_owner
from app.shared.schemas import PaginatedResponse, PaginationMeta, StandardResponse
from app.tenants.schemas import TenantCreate, TenantMoveOutRequest, TenantResponse, TenantUpdate
from app.tenants.service import TenantService

router = APIRouter(
    prefix="/apartments/{apartment_public_id}/tenants",
    tags=["tenants"],
)

router_portfolio = APIRouter(
    prefix="/tenants",
    tags=["tenants"],
)


async def _resolve_apt_info(db: AsyncSession, apartment_public_id: UUID) -> tuple[str, str]:
    """Return (building_name, apartment_unit_number) for a given apartment_public_id."""
    result = await db.execute(
        select(Building.name, Apartment.unit_number)
        .select_from(Apartment)
        .join(Building, Building.id == Apartment.building_id)
        .where(Apartment.public_id == apartment_public_id)
    )
    return result.one()


def _to_response(
    tenant: Tenant, apartment_public_id: UUID, building_name: str, apartment_unit_number: str
) -> TenantResponse:
    return TenantResponse(
        public_id=tenant.public_id,
        apartment_public_id=apartment_public_id,
        building_name=building_name,
        apartment_unit_number=apartment_unit_number,
        full_name=tenant.full_name,
        phone=tenant.phone,
        nid_number=tenant.nid_number,
        address=tenant.address,
        member_count=tenant.member_count,
        move_in_date=tenant.move_in_date,
        move_out_date=tenant.move_out_date,
        is_active=tenant.is_active,
        created_at=tenant.created_at,
    )


@router_portfolio.get("", response_model=PaginatedResponse)
async def list_tenants_portfolio(
    status: str | None = Query(None, pattern="^(active|moved_out)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> PaginatedResponse:
    service = TenantService(db, owner_id)
    tenants, total = await service.list_tenants(status, page, page_size)
    items: list[TenantResponse] = []
    for tenant in tenants:
        result = await db.execute(
            select(
                Apartment.public_id,
                Apartment.unit_number,
                Building.name,
            )
            .join(Building, Building.id == Apartment.building_id)
            .where(Apartment.id == tenant.apartment_id)
        )
        apt_pid, apt_unit, bld_name = result.one()
        items.append(_to_response(tenant, apt_pid, bld_name, apt_unit))
    return PaginatedResponse(
        success=True,
        data=items,
        pagination=PaginationMeta(page=page, page_size=page_size, total=total),
    )


@router_portfolio.get("/{tenant_public_id}", response_model=StandardResponse)
async def get_tenant_portfolio(
    tenant_public_id: UUID,
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> StandardResponse:
    service = TenantService(db, owner_id)
    tenant = await service.get_tenant_by_public_id(tenant_public_id)
    result = await db.execute(
        select(Apartment.public_id, Apartment.unit_number, Building.name)
        .select_from(Apartment)
        .join(Building, Building.id == Apartment.building_id)
        .where(Apartment.id == tenant.apartment_id)
    )
    apt_pid, apt_unit, bld_name = result.one()
    return StandardResponse(success=True, data=_to_response(tenant, apt_pid, bld_name, apt_unit))


@router.post("", response_model=StandardResponse, status_code=http_status.HTTP_201_CREATED)
async def add_tenant(
    apartment_public_id: UUID,
    body: TenantCreate,
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> StandardResponse:
    service = TenantService(db, owner_id)
    tenant = await service.add_tenant(apartment_public_id, body)
    bld_name, apt_unit = await _resolve_apt_info(db, apartment_public_id)
    return StandardResponse(
        success=True,
        data=_to_response(tenant, apartment_public_id, bld_name, apt_unit),
        message="Tenant added",
    )


@router.get("/active", response_model=StandardResponse)
async def get_active_tenant(
    apartment_public_id: UUID,
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> StandardResponse:
    service = TenantService(db, owner_id)
    tenant = await service.get_active_tenant_for_apartment(apartment_public_id)
    bld_name, apt_unit = await _resolve_apt_info(db, apartment_public_id)
    return StandardResponse(
        success=True, data=_to_response(tenant, apartment_public_id, bld_name, apt_unit)
    )


@router.get("/{tenant_public_id}", response_model=StandardResponse)
async def get_tenant(
    apartment_public_id: UUID,
    tenant_public_id: UUID,
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> StandardResponse:
    service = TenantService(db, owner_id)
    tenant = await service.get_tenant(apartment_public_id, tenant_public_id)
    bld_name, apt_unit = await _resolve_apt_info(db, apartment_public_id)
    return StandardResponse(
        success=True, data=_to_response(tenant, apartment_public_id, bld_name, apt_unit)
    )


@router.put("/{tenant_public_id}", response_model=StandardResponse)
async def update_tenant(
    apartment_public_id: UUID,
    tenant_public_id: UUID,
    body: TenantUpdate,
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> StandardResponse:
    service = TenantService(db, owner_id)
    tenant = await service.update_tenant(apartment_public_id, tenant_public_id, body)
    bld_name, apt_unit = await _resolve_apt_info(db, apartment_public_id)
    return StandardResponse(
        success=True,
        data=_to_response(tenant, apartment_public_id, bld_name, apt_unit),
        message="Tenant updated",
    )


@router.delete("/{tenant_public_id}", response_model=StandardResponse)
async def move_out_tenant(
    apartment_public_id: UUID,
    tenant_public_id: UUID,
    body: TenantMoveOutRequest,
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> StandardResponse:
    service = TenantService(db, owner_id)
    await service.mark_moved_out(apartment_public_id, tenant_public_id, body)
    return StandardResponse(success=True, message="Tenant moved out")
