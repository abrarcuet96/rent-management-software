from datetime import date, datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, ForeignKey, Numeric, Text, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PaymentRecord(Base):
    """A single payment received against a MonthlyDue.
    One MonthlyDue can have many PaymentRecords (partial payments)."""

    __tablename__ = "payment_record"
    __table_args__ = (CheckConstraint("amount_paid > 0", name="ck_payment_record_amount_paid"),)

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    public_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), unique=True, nullable=False, default=uuid4
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    due_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("monthly_due.id", ondelete="RESTRICT"),
        nullable=False,
    )
    amount_paid: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    paid_on: Mapped[date] = mapped_column(Date, nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_bulk: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    monthly_due: Mapped["MonthlyDue"] = relationship(back_populates="payment_records")  # type: ignore[name-defined]
