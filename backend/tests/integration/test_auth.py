"""Integration tests for /api/v1/auth endpoints."""

from app.models.owner import Owner
from httpx import AsyncClient
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

BASE = "/api/v1/auth"

_VALID = {
    "full_name": "Alice Smith",
    "email": "alice@example.com",
    "password": "securepassword1",
}


# ── register ──────────────────────────────────────────────────────────────────


async def test_register_success(client: AsyncClient):
    """Valid registration returns 201 with an access token."""
    resp = await client.post(f"{BASE}/register", json=_VALID)
    assert resp.status_code == 201
    body = resp.json()
    assert body["success"] is True
    assert "access_token" in body["data"]
    assert body["data"]["token_type"] == "bearer"


async def test_register_duplicate_email(client: AsyncClient):
    """Registering the same email twice returns 400."""
    await client.post(f"{BASE}/register", json=_VALID)
    resp = await client.post(f"{BASE}/register", json=_VALID)
    assert resp.status_code == 400


async def test_register_missing_fields(client: AsyncClient):
    """Missing required fields return 422."""
    resp = await client.post(f"{BASE}/register", json={"email": "x@x.com"})
    assert resp.status_code == 422


async def test_register_invalid_email(client: AsyncClient):
    """Malformed email address returns 422."""
    resp = await client.post(
        f"{BASE}/register",
        json={"full_name": "Bob", "email": "not-an-email", "password": "password123"},
    )
    assert resp.status_code == 422


async def test_register_short_password(client: AsyncClient):
    """Password shorter than 8 characters returns 422."""
    resp = await client.post(
        f"{BASE}/register",
        json={"full_name": "Bob", "email": "bob@example.com", "password": "short"},
    )
    assert resp.status_code == 422


# ── login ─────────────────────────────────────────────────────────────────────


async def test_login_success(client: AsyncClient):
    """Valid credentials return 200 with an access token."""
    await client.post(f"{BASE}/register", json=_VALID)
    resp = await client.post(
        f"{BASE}/login",
        json={"email": _VALID["email"], "password": _VALID["password"]},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert "access_token" in body["data"]


async def test_login_wrong_password(client: AsyncClient):
    """Correct email but wrong password returns 401."""
    await client.post(f"{BASE}/register", json=_VALID)
    resp = await client.post(
        f"{BASE}/login",
        json={"email": _VALID["email"], "password": "wrongpassword"},
    )
    assert resp.status_code == 401


async def test_login_wrong_email(client: AsyncClient):
    """Non-existent email returns 401."""
    resp = await client.post(
        f"{BASE}/login",
        json={"email": "nobody@example.com", "password": "somepassword"},
    )
    assert resp.status_code == 401


async def test_login_inactive_owner(client: AsyncClient, db: AsyncSession):
    """Deactivated owner cannot log in and receives 401."""
    await client.post(f"{BASE}/register", json=_VALID)
    await db.execute(update(Owner).where(Owner.email == _VALID["email"]).values(is_active=False))
    await db.flush()

    resp = await client.post(
        f"{BASE}/login",
        json={"email": _VALID["email"], "password": _VALID["password"]},
    )
    assert resp.status_code == 401
