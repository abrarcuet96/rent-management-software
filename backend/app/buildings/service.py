from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.buildings.schemas import BuildingCreate, BuildingUpdate
from app.models.apartment import Apartment
from app.models.building import Building


class BuildingService:
    def __init__(self, db: AsyncSession, owner_id: UUID) -> None:
        self.db = db
        self.owner_id = owner_id

    def _base_where(self) -> tuple:
        return (
            Building.owner_id == self.owner_id,
            Building.is_active.is_(True),
        )

    async def _get_or_404(self, public_id: UUID) -> Building:
        result = await self.db.execute(
            select(Building).where(
                Building.public_id == public_id,
                *self._base_where(),
            )
        )
        building = result.scalar_one_or_none()
        if building is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Building not found")
        return building

    async def list_buildings(self, page: int, page_size: int) -> tuple[list[Building], int]:
        where = self._base_where()
        total = await self.db.scalar(select(func.count()).select_from(Building).where(*where))
        offset = (page - 1) * page_size
        result = await self.db.execute(
            select(Building)
            .where(*where)
            .order_by(Building.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        return list(result.scalars().all()), total or 0

    async def get_building(self, public_id: UUID) -> Building:
        return await self._get_or_404(public_id)

    async def create_building(self, data: BuildingCreate) -> Building:
        building = Building(
            owner_id=self.owner_id,
            name=data.name,
            address=data.address,
            total_floors=data.total_floors,
        )
        self.db.add(building)
        await self.db.commit()
        await self.db.refresh(building)
        return building

    async def update_building(self, public_id: UUID, data: BuildingUpdate) -> Building:
        building = await self._get_or_404(public_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(building, field, value)
        await self.db.commit()
        await self.db.refresh(building)
        return building

    async def deactivate_building(self, public_id: UUID) -> None:
        building = await self._get_or_404(public_id)
        active_apartments = await self.db.scalar(
            select(func.count())
            .select_from(Apartment)
            .where(
                Apartment.building_id == building.id,
                Apartment.is_active.is_(True),
            )
        )
        if active_apartments:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Building has active apartments. Deactivate them first.",
            )
        building.is_active = False
        await self.db.commit()
