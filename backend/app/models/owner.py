from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, String, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Owner(Base):
    """Authenticated owner account. Root of the multi-tenancy tree."""

    __tablename__ = "owner"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    public_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), unique=True, nullable=False, default=uuid4
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    buildings: Mapped[list["Building"]] = relationship(back_populates="owner")  # type: ignore[name-defined]
    expense_categories: Mapped[list["ExpenseCategory"]] = relationship(back_populates="owner")  # type: ignore[name-defined]
    expenses: Mapped[list["Expense"]] = relationship(back_populates="owner")  # type: ignore[name-defined]
