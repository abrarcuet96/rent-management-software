"""
Shared pytest fixtures for the RentFlow test suite.

All async fixtures share one session-scoped event loop (via
asyncio_default_fixture_loop_scope = session in pytest.ini) so that
asyncpg connection objects are never passed across loop boundaries.

Isolation: each test gets a savepoint; the outer transaction is rolled
back after the test so tables stay empty between tests.
"""

from __future__ import annotations

import pytest_asyncio
from app.core.database import Base, get_db
from httpx import ASGITransport, AsyncClient
from main import app
from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/rentflow_test"


# ── engine (session-scoped so asyncpg never crosses loop boundaries) ──────────


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    """Create the async engine once for the whole test session."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False, future=True)
    yield engine
    await engine.dispose()


# ── schema lifecycle ──────────────────────────────────────────────────────────


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_db(test_engine):
    """Drop + create all tables before the session; drop again after."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


# ── per-test transaction isolation ────────────────────────────────────────────


@pytest_asyncio.fixture
async def db(test_engine):
    """
    Yield an AsyncSession in a SAVEPOINT transaction.

    After each test the outer transaction is rolled back so no data
    persists. The event listener re-opens a fresh SAVEPOINT after every
    service-layer commit so the session stays usable throughout the test.
    """
    conn = await test_engine.connect()
    await conn.begin()

    session = AsyncSession(bind=conn, expire_on_commit=False)
    await session.begin_nested()

    @event.listens_for(session.sync_session, "after_transaction_end")
    def _restart_savepoint(sync_session, transaction):
        if transaction.nested and not transaction._parent.nested:
            sync_session.begin_nested()

    yield session

    await session.close()
    await conn.rollback()
    await conn.close()


# ── FastAPI client wired to the test session ──────────────────────────────────


@pytest_asyncio.fixture
async def client(db: AsyncSession):
    """AsyncClient with the app's get_db overridden to use the test session."""

    async def _override_get_db():
        yield db

    app.dependency_overrides[get_db] = _override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


# ── auth helpers ──────────────────────────────────────────────────────────────

_TEST_OWNER = {
    "full_name": "Test Owner",
    "email": "testowner@example.com",
    "password": "testpassword123",
}


@pytest_asyncio.fixture
async def auth_token(client: AsyncClient) -> str:
    """Register a test owner and return its JWT access token."""
    resp = await client.post("/api/v1/auth/register", json=_TEST_OWNER)
    assert resp.status_code == 201, resp.text
    return resp.json()["data"]["access_token"]


@pytest_asyncio.fixture
async def test_owner_id(client: AsyncClient, auth_token: str, db: AsyncSession):
    """Return the internal UUID of the test owner registered via auth_token."""
    from app.models.owner import Owner
    from sqlalchemy import select

    result = await db.execute(select(Owner.id).where(Owner.email == _TEST_OWNER["email"]))
    return result.scalar_one()


# ── resource helpers ──────────────────────────────────────────────────────────


@pytest_asyncio.fixture
async def test_building(client: AsyncClient, auth_token: str) -> dict:
    """Create a building via the API and return its response payload."""
    resp = await client.post(
        "/api/v1/buildings",
        json={"name": "Test Building", "address": "1 Test St", "total_floors": 3},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["data"]


@pytest_asyncio.fixture
async def test_apartment(client: AsyncClient, auth_token: str, test_building: dict) -> dict:
    """Create an apartment under test_building via the API and return its payload."""
    building_id = test_building["public_id"]
    resp = await client.post(
        f"/api/v1/buildings/{building_id}/apartments",
        json={"unit_number": "101", "floor": 1},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["data"]


@pytest_asyncio.fixture
async def test_tenant(client: AsyncClient, auth_token: str, test_apartment: dict) -> dict:
    """Create a tenant under test_apartment via the API and return its payload."""
    apt_id = test_apartment["public_id"]
    resp = await client.post(
        f"/api/v1/apartments/{apt_id}/tenants",
        json={
            "full_name": "Jane Doe",
            "phone": "01700000000",
            "move_in_date": "2024-01-01",
            "initial_rent_amount": "10000.00",
            "agreement_start_date": "2024-01-01",
        },
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["data"]


@pytest_asyncio.fixture
async def test_due(client: AsyncClient, auth_token: str, test_tenant: dict) -> dict:
    """Generate a Jan 2024 monthly due (10 000.00, unpaid) for test_tenant.

    due_date is set to 2024-01-10, which is in the past — it will appear
    in the overdue list when the test runs.
    """
    resp = await client.post(
        f"/api/v1/tenants/{test_tenant['public_id']}/dues/generate",
        json={"month": 1, "year": 2024, "due_date": "2024-01-10"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["data"]
