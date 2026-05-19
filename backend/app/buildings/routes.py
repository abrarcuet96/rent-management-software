from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.buildings.schemas import BuildingCreate, BuildingResponse, BuildingUpdate
from app.buildings.service import BuildingService
from app.core.database import get_db
from app.shared.dependencies import get_current_owner
from app.shared.schemas import PaginatedResponse, PaginationMeta, StandardResponse

router = APIRouter(prefix="/buildings", tags=["buildings"])


@router.get("", response_model=PaginatedResponse)
async def list_buildings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> PaginatedResponse:
    service = BuildingService(db, owner_id)
    buildings, total = await service.list_buildings(page, page_size)
    return PaginatedResponse(
        success=True,
        data=[BuildingResponse.model_validate(b) for b in buildings],
        pagination=PaginationMeta(page=page, page_size=page_size, total=total),
    )


@router.post("", response_model=StandardResponse, status_code=status.HTTP_201_CREATED)
async def create_building(
    body: BuildingCreate,
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> StandardResponse:
    service = BuildingService(db, owner_id)
    building = await service.create_building(body)
    return StandardResponse(
        success=True,
        data=BuildingResponse.model_validate(building),
        message="Building created",
    )


@router.get("/{public_id}", response_model=StandardResponse)
async def get_building(
    public_id: UUID,
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> StandardResponse:
    service = BuildingService(db, owner_id)
    building = await service.get_building(public_id)
    return StandardResponse(success=True, data=BuildingResponse.model_validate(building))


@router.put("/{public_id}", response_model=StandardResponse)
async def update_building(
    public_id: UUID,
    body: BuildingUpdate,
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> StandardResponse:
    service = BuildingService(db, owner_id)
    building = await service.update_building(public_id, body)
    return StandardResponse(
        success=True,
        data=BuildingResponse.model_validate(building),
        message="Building updated",
    )


@router.delete("/{public_id}", response_model=StandardResponse)
async def delete_building(
    public_id: UUID,
    db: AsyncSession = Depends(get_db),
    owner_id: UUID = Depends(get_current_owner),
) -> StandardResponse:
    service = BuildingService(db, owner_id)
    await service.deactivate_building(public_id)
    return StandardResponse(success=True, message="Building deleted")
