from datetime import date, datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, ForeignKey, Numeric, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TenantAgreement(Base):
    """Rent agreement for a Tenant. end_date IS NULL means this is the active agreement.
    Rent changes are expressed as new agreement records, not updates to existing ones."""

    __tablename__ = "tenant_agreement"
    __table_args__ = (CheckConstraint("rent_amount > 0", name="ck_tenant_agreement_rent_amount"),)

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    public_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), unique=True, nullable=False, default=uuid4
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    tenant_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("tenant.id", ondelete="RESTRICT"),
        nullable=False,
    )
    rent_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    tenant: Mapped["Tenant"] = relationship(back_populates="agreements")  # type: ignore[name-defined]
    monthly_dues: Mapped[list["MonthlyDue"]] = relationship(back_populates="agreement")  # type: ignore[name-defined]
