from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password
from app.models.expense_category import ExpenseCategory
from app.models.owner import Owner

DEFAULT_EXPENSE_CATEGORIES = [
    "বিদ্যুৎ",
    "পানি",
    "গ্যাস",
    "রক্ষণাবেক্ষণ",
    "মেরামত",
    "পরিষ্কার",
    "নিরাপত্তা",
    "অন্যান্য",
]


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def register(self, full_name: str, email: str, password: str) -> Owner:
        """Create a new owner account.

        Raises ValueError if the email is already in use (active or inactive).
        """
        stmt = select(Owner).where(Owner.email == email)
        result = await self.db.execute(stmt)
        if result.scalar_one_or_none() is not None:
            raise ValueError("Email already registered")

        owner = Owner(
            full_name=full_name,
            email=email,
            hashed_password=hash_password(password),
        )
        self.db.add(owner)
        await self.db.flush()  # get owner.id without committing yet

        # Seed default expense categories for the new owner
        for name in DEFAULT_EXPENSE_CATEGORIES:
            self.db.add(ExpenseCategory(owner_id=owner.id, name=name, is_default=True))

        await self.db.commit()
        await self.db.refresh(owner)
        return owner

    async def authenticate(self, email: str, password: str) -> Owner | None:
        """Verify credentials and return the Owner, or None if invalid.

        Returns None for any failure (bad email, wrong password, inactive account)
        to avoid leaking which check failed.
        """
        stmt = select(Owner).where(Owner.email == email, Owner.is_active.is_(True))
        result = await self.db.execute(stmt)
        owner = result.scalar_one_or_none()
        if owner is None:
            return None
        if not verify_password(password, owner.hashed_password):
            return None
        return owner

    async def get_owner_by_id(self, owner_id: UUID) -> Owner | None:
        """Fetch an active owner by internal UUID."""
        stmt = select(Owner).where(Owner.id == owner_id, Owner.is_active.is_(True))
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_owner_by_public_id(self, public_id: UUID) -> Owner | None:
        """Fetch an active owner by public UUID."""
        stmt = select(Owner).where(Owner.public_id == public_id, Owner.is_active.is_(True))
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
