from datetime import date, datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class MonthlyDue(Base):
    """Snapshot of what a Tenant owes for a calendar month.
    Immutable once created — payments are recorded via PaymentRecord.
    remaining_balance must be recalculated after every PaymentRecord insert."""

    __tablename__ = "monthly_due"
    __table_args__ = (
        UniqueConstraint("tenant_id", "month", "year", name="uq_monthly_due_tenant_month_year"),
        CheckConstraint("month BETWEEN 1 AND 12", name="ck_monthly_due_month"),
        CheckConstraint("year BETWEEN 2000 AND 2100", name="ck_monthly_due_year"),
        CheckConstraint("amount_paid >= 0", name="ck_monthly_due_amount_paid"),
        CheckConstraint("remaining_balance >= 0", name="ck_monthly_due_remaining_balance"),
        CheckConstraint("status IN ('unpaid', 'partial', 'paid')", name="ck_monthly_due_status"),
    )

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
    agreement_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("tenant_agreement.id", ondelete="RESTRICT"),
        nullable=False,
    )
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    rent_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    total_due: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    amount_paid: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False, default=Decimal("0")
    )
    remaining_balance: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="unpaid")
    is_auto_generated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    tenant: Mapped["Tenant"] = relationship(back_populates="monthly_dues")  # type: ignore[name-defined]
    agreement: Mapped["TenantAgreement"] = relationship(back_populates="monthly_dues")  # type: ignore[name-defined]
    payment_records: Mapped[list["PaymentRecord"]] = relationship(back_populates="monthly_due")  # type: ignore[name-defined]
    due_expenses: Mapped[list["DueExpense"]] = relationship(back_populates="monthly_due")  # type: ignore[name-defined]
