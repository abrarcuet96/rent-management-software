from datetime import date, datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Expense(Base):
    """An expense recorded by an Owner, scoped to a building or apartment.
    When is_tenant_charged=True a DueExpense row links it to a MonthlyDue."""

    __tablename__ = "expense"
    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_expense_amount"),
        CheckConstraint("scope IN ('building', 'apartment')", name="ck_expense_scope"),
    )

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    public_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), unique=True, nullable=False, default=uuid4
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    owner_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("owner.id", ondelete="RESTRICT"),
        nullable=False,
    )
    building_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("building.id", ondelete="RESTRICT"),
        nullable=True,
    )
    apartment_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("apartment.id", ondelete="RESTRICT"),
        nullable=True,
    )
    category_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("expense_category.id", ondelete="RESTRICT"),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    expense_date: Mapped[date] = mapped_column(Date, nullable=False)
    scope: Mapped[str] = mapped_column(String(20), nullable=False)
    is_tenant_charged: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    owner: Mapped["Owner"] = relationship(back_populates="expenses")  # type: ignore[name-defined]
    building: Mapped["Building | None"] = relationship(back_populates="expenses")  # type: ignore[name-defined]
    apartment: Mapped["Apartment | None"] = relationship(back_populates="expenses")  # type: ignore[name-defined]
    category: Mapped["ExpenseCategory"] = relationship(back_populates="expenses")  # type: ignore[name-defined]
    due_expenses: Mapped[list["DueExpense"]] = relationship(back_populates="expense")  # type: ignore[name-defined]
