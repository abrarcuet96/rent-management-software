from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.apartment import Apartment
from app.models.building import Building
from app.models.tenant import Tenant
from app.models.tenant_agreement import TenantAgreement
from app.tenants.schemas import TenantCreate, TenantMoveOutRequest, TenantUpdate


class TenantService:
    def __init__(self, db: AsyncSession, owner_id: UUID) -> None:
        self.db = db
        self.owner_id = owner_id

    async def _get_apartment(self, apartment_public_id: UUID) -> Apartment:
        """Resolve apartment, verifying it belongs to this owner via building chain."""
        result = await self.db.execute(
            select(Apartment)
            .join(Building, Building.id == Apartment.building_id)
            .where(
                Apartment.public_id == apartment_public_id,
                Apartment.is_active.is_(True),
                Building.owner_id == self.owner_id,
                Building.is_active.is_(True),
            )
        )
        apt = result.scalar_one_or_none()
        if apt is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Apartment not found")
        return apt

    async def _get_tenant_or_404(self, apartment_public_id: UUID, tenant_public_id: UUID) -> Tenant:
        """Get an active tenant, verifying the full ownership chain."""
        result = await self.db.execute(
            select(Tenant)
            .join(Apartment, Apartment.id == Tenant.apartment_id)
            .join(Building, Building.id == Apartment.building_id)
            .where(
                Tenant.public_id == tenant_public_id,
                Tenant.is_active.is_(True),
                Apartment.public_id == apartment_public_id,
                Apartment.is_active.is_(True),
                Building.owner_id == self.owner_id,
                Building.is_active.is_(True),
            )
        )
        tenant = result.scalar_one_or_none()
        if tenant is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")
        return tenant

    async def list_tenants(
        self,
        status_filter: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Tenant], int]:
        """List all tenants across the owner's portfolio."""
        conditions: list = [
            Building.owner_id == self.owner_id,
            Building.is_active.is_(True),
        ]
        if status_filter == "active":
            conditions.append(Tenant.is_active.is_(True))
        elif status_filter == "moved_out":
            conditions.append(Tenant.is_active.is_(False))

        total = await self.db.scalar(
            select(func.count())
            .select_from(Tenant)
            .join(Apartment, Apartment.id == Tenant.apartment_id)
            .join(Building, Building.id == Apartment.building_id)
            .where(*conditions)
        )
        offset = (page - 1) * page_size
        result = await self.db.execute(
            select(Tenant)
            .join(Apartment, Apartment.id == Tenant.apartment_id)
            .join(Building, Building.id == Apartment.building_id)
            .where(*conditions)
            .order_by(Tenant.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        return list(result.scalars().all()), total or 0

    async def add_tenant(self, apartment_public_id: UUID, data: TenantCreate) -> Tenant:
        apt = await self._get_apartment(apartment_public_id)
        if apt.status != "vacant":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Apartment already has an active tenant",
            )

        tenant = Tenant(
            apartment_id=apt.id,
            full_name=data.full_name,
            phone=data.phone,
            nid_number=data.nid_number,
            address=data.address,
            member_count=data.member_count,
            move_in_date=data.move_in_date,
        )
        self.db.add(tenant)
        await self.db.flush()

        agreement = TenantAgreement(
            tenant_id=tenant.id,
            rent_amount=data.initial_rent_amount,
            start_date=data.agreement_start_date,
        )
        self.db.add(agreement)

        apt.status = "occupied"
        await self.db.commit()
        await self.db.refresh(tenant)
        return tenant

    async def get_tenant(self, apartment_public_id: UUID, tenant_public_id: UUID) -> Tenant:
        return await self._get_tenant_or_404(apartment_public_id, tenant_public_id)

    async def get_tenant_by_public_id(self, tenant_public_id: UUID) -> Tenant:
        """Get a tenant by public_id, verifying ownership via building chain."""
        result = await self.db.execute(
            select(Tenant)
            .join(Apartment, Apartment.id == Tenant.apartment_id)
            .join(Building, Building.id == Apartment.building_id)
            .where(
                Tenant.public_id == tenant_public_id,
                Building.owner_id == self.owner_id,
                Building.is_active.is_(True),
            )
        )
        tenant = result.scalar_one_or_none()
        if tenant is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")
        return tenant

    async def get_active_tenant_for_apartment(self, apartment_public_id: UUID) -> Tenant:
        """Get the active tenant for a specific apartment."""
        result = await self.db.execute(
            select(Tenant)
            .join(Apartment, Apartment.id == Tenant.apartment_id)
            .join(Building, Building.id == Apartment.building_id)
            .where(
                Apartment.public_id == apartment_public_id,
                Apartment.is_active.is_(True),
                Tenant.is_active.is_(True),
                Building.owner_id == self.owner_id,
                Building.is_active.is_(True),
            )
        )
        tenant = result.scalar_one_or_none()
        if tenant is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")
        return tenant

    async def update_tenant(
        self,
        apartment_public_id: UUID,
        tenant_public_id: UUID,
        data: TenantUpdate,
    ) -> Tenant:
        tenant = await self._get_tenant_or_404(apartment_public_id, tenant_public_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(tenant, field, value)
        await self.db.commit()
        await self.db.refresh(tenant)
        return tenant

    async def mark_moved_out(
        self,
        apartment_public_id: UUID,
        tenant_public_id: UUID,
        data: TenantMoveOutRequest,
    ) -> None:
        tenant = await self._get_tenant_or_404(apartment_public_id, tenant_public_id)

        tenant.move_out_date = data.move_out_date
        tenant.is_active = False

        # Close all active agreements
        agreements = await self.db.execute(
            select(TenantAgreement).where(
                TenantAgreement.tenant_id == tenant.id,
                TenantAgreement.is_active.is_(True),
            )
        )
        for agreement in agreements.scalars().all():
            agreement.is_active = False
            agreement.end_date = data.move_out_date

        # Free up the apartment
        apt_result = await self.db.execute(
            select(Apartment).where(Apartment.id == tenant.apartment_id)
        )
        apt = apt_result.scalar_one()
        apt.status = "vacant"

        await self.db.commit()
