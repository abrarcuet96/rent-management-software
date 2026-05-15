from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Numeric,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DueExpense(Base):
    """Junction table linking a tenant-charged Expense to a MonthlyDue.
    No public_id — this table is not directly exposed in API URLs."""

    __tablename__ = "due_expense"
    __table_args__ = (
        UniqueConstraint("due_id", "expense_id", name="uq_due_expense_due_expense"),
        CheckConstraint("charged_amount > 0", name="ck_due_expense_charged_amount"),
    )

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    due_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("monthly_due.id", ondelete="RESTRICT"),
        nullable=False,
    )
    expense_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("expense.id", ondelete="RESTRICT"),
        nullable=False,
    )
    charged_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    monthly_due: Mapped["MonthlyDue"] = relationship(back_populates="due_expenses")  # type: ignore[name-defined]
    expense: Mapped["Expense"] = relationship(back_populates="due_expenses")  # type: ignore[name-defined]
