from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Apartment(Base):
    """A rentable unit inside a Building."""

    __tablename__ = "apartment"
    __table_args__ = (
        UniqueConstraint("building_id", "unit_number", name="uq_apartment_building_unit"),
        CheckConstraint("status IN ('vacant', 'occupied')", name="ck_apartment_status"),
    )

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    public_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), unique=True, nullable=False, default=uuid4
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    building_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("building.id", ondelete="RESTRICT"),
        nullable=False,
    )
    unit_number: Mapped[str] = mapped_column(String(50), nullable=False)
    floor: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="vacant")

    building: Mapped["Building"] = relationship(back_populates="apartments")  # type: ignore[name-defined]
    tenants: Mapped[list["Tenant"]] = relationship(back_populates="apartment")  # type: ignore[name-defined]
    expenses: Mapped[list["Expense"]] = relationship(back_populates="apartment")  # type: ignore[name-defined]
