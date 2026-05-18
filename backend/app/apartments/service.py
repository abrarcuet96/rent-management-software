from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.apartments.schemas import ApartmentCreate, ApartmentUpdate
from app.models.apartment import Apartment
from app.models.building import Building
from app.models.tenant import Tenant


class ApartmentService:
    def __init__(self, db: AsyncSession, owner_id: UUID) -> None:
        self.db = db
        self.owner_id = owner_id

    async def _resolve_building(self, building_public_id: UUID) -> UUID:
        """Return the internal building.id after verifying ownership."""
        building_id = await self.db.scalar(
            select(Building.id).where(
                Building.public_id == building_public_id,
                Building.owner_id == self.owner_id,
                Building.is_active.is_(True),
            )
        )
        if building_id is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Building not found")
        return building_id

    async def _resolve_building_with_floors(self, building_public_id: UUID) -> tuple[UUID, int]:
        """Return (internal building.id, total_floors) after verifying ownership."""
        result = await self.db.execute(
            select(Building.id, Building.total_floors).where(
                Building.public_id == building_public_id,
                Building.owner_id == self.owner_id,
                Building.is_active.is_(True),
            )
        )
        row = result.one_or_none()
        if row is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Building not found")
        return row[0], row[1]

    async def _get_or_404(self, building_public_id: UUID, apartment_public_id: UUID) -> Apartment:
        building_id = await self._resolve_building(building_public_id)
        result = await self.db.execute(
            select(Apartment).where(
                Apartment.public_id == apartment_public_id,
                Apartment.building_id == building_id,
                Apartment.is_active.is_(True),
            )
        )
        apt = result.scalar_one_or_none()
        if apt is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Apartment not found")
        return apt

    async def list_apartments(
        self,
        building_public_id: UUID,
        page: int,
        page_size: int,
        apt_status: str | None = None,
    ) -> tuple[list[Apartment], int]:
        building_id = await self._resolve_building(building_public_id)
        conditions = [
            Apartment.building_id == building_id,
            Apartment.is_active.is_(True),
        ]
        if apt_status is not None:
            conditions.append(Apartment.status == apt_status)

        total = await self.db.scalar(select(func.count()).select_from(Apartment).where(*conditions))
        offset = (page - 1) * page_size
        result = await self.db.execute(
            select(Apartment)
            .where(*conditions)
            .order_by(Apartment.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        return list(result.scalars().all()), total or 0

    async def get_apartment(self, building_public_id: UUID, apartment_public_id: UUID) -> Apartment:
        return await self._get_or_404(building_public_id, apartment_public_id)

    async def create_apartment(self, building_public_id: UUID, data: ApartmentCreate) -> Apartment:
        building_id, total_floors = await self._resolve_building_with_floors(building_public_id)
        if data.floor > total_floors:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"তলা নম্বর {data.floor} বিল্ডিংয়ের সর্বোচ্চ তলা ({total_floors}) এর বেশি হতে পারে না",
            )
        apt = Apartment(
            building_id=building_id,
            unit_number=data.unit_number,
            floor=data.floor,
            status=data.status,
        )
        self.db.add(apt)
        try:
            await self.db.commit()
        except IntegrityError:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unit number already exists in this building",
            )
        await self.db.refresh(apt)
        return apt

    async def update_apartment(
        self,
        building_public_id: UUID,
        apartment_public_id: UUID,
        data: ApartmentUpdate,
    ) -> Apartment:
        apt = await self._get_or_404(building_public_id, apartment_public_id)
        if data.floor is not None:
            total_floors = await self.db.scalar(
                select(Building.total_floors).where(Building.id == apt.building_id)
            )
            if data.floor > total_floors:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"তলা নম্বর {data.floor} বিল্ডিংয়ের সর্বোচ্চ তলা ({total_floors}) এর বেশি হতে পারে না",
                )
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(apt, field, value)
        try:
            await self.db.commit()
        except IntegrityError:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unit number already exists in this building",
            )
        await self.db.refresh(apt)
        return apt

    async def deactivate_apartment(
        self, building_public_id: UUID, apartment_public_id: UUID
    ) -> None:
        apt = await self._get_or_404(building_public_id, apartment_public_id)
        active_tenant = await self.db.scalar(
            select(func.count())
            .select_from(Tenant)
            .where(
                Tenant.apartment_id == apt.id,
                Tenant.is_active.is_(True),
            )
        )
        if active_tenant:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Apartment has an active tenant. Move them out first.",
            )
        apt.is_active = False
        await self.db.commit()
