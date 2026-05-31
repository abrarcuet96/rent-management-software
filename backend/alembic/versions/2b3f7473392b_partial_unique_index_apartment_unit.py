"""partial_unique_index_apartment_unit

Revision ID: 2b3f7473392b
Revises: 
Create Date: 2026-05-31 06:56:47.658290

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2b3f7473392b'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS uq_apartment_active_unit
        ON apartment(building_id, unit_number)
        WHERE is_active = TRUE
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_apartment_active_unit")
