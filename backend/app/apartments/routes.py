from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi import status as http_status
from sqlalchemy.ext.asyncio import AsyncSession

from app.apartments.schemas import ApartmentCreate, ApartmentResponse, ApartmentUpdate
from app.apartments.service import ApartmentService
from app.core.database import get_db
from app.models.apartment import Apartment
from app.shared.dependencies import get_current_owner
from app.shared.schemas import PaginatedResponse, PaginationMeta, StandardResponse

router = APIRouter(
    prefix="/buildings/{building_public_id}/apartments",
    tags=["apartments"],
)


def _to_response(apt: Apartment, building_public_id: UUID) -> ApartmentResponse:
    return ApartmentResponse(
        public_id=apt.public_id,
        building_public_id=building_public_id,
        unit_number=apt.unit_number,
        floor=apt.floor,
        status=apt.status,
        is_active=apt.is_active,
        created_at=apt.created_at,
    )


@router.get("", response_model=PaginatedResponse)
async def list_apartments(
    building_public_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = Query(None, pattern="^(vacant|occupied)$"),
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> PaginatedResponse:
    service = ApartmentService(db, owner_id)
    apartments, total = await service.list_apartments(building_public_id, page, page_size, status)
    return PaginatedResponse(
        success=True,
        data=[_to_response(a, building_public_id) for a in apartments],
        pagination=PaginationMeta(page=page, page_size=page_size, total=total),
    )


@router.post("", response_model=StandardResponse, status_code=http_status.HTTP_201_CREATED)
async def create_apartment(
    building_public_id: UUID,
    body: ApartmentCreate,
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> StandardResponse:
    service = ApartmentService(db, owner_id)
    apt = await service.create_apartment(building_public_id, body)
    return StandardResponse(
        success=True,
        data=_to_response(apt, building_public_id),
        message="Apartment created",
    )


@router.get("/{apartment_public_id}", response_model=StandardResponse)
async def get_apartment(
    building_public_id: UUID,
    apartment_public_id: UUID,
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> StandardResponse:
    service = ApartmentService(db, owner_id)
    apt = await service.get_apartment(building_public_id, apartment_public_id)
    return StandardResponse(success=True, data=_to_response(apt, building_public_id))


@router.put("/{apartment_public_id}", response_model=StandardResponse)
async def update_apartment(
    building_public_id: UUID,
    apartment_public_id: UUID,
    body: ApartmentUpdate,
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> StandardResponse:
    service = ApartmentService(db, owner_id)
    apt = await service.update_apartment(building_public_id, apartment_public_id, body)
    return StandardResponse(
        success=True,
        data=_to_response(apt, building_public_id),
        message="Apartment updated",
    )


@router.delete("/{apartment_public_id}", response_model=StandardResponse)
async def delete_apartment(
    building_public_id: UUID,
    apartment_public_id: UUID,
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> StandardResponse:
    service = ApartmentService(db, owner_id)
    await service.deactivate_apartment(building_public_id, apartment_public_id)
    return StandardResponse(success=True, message="Apartment deactivated")
