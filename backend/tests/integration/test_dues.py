"""Integration tests for monthly due generation, listing, and adjustment."""

from datetime import date

from app.models.tenant_agreement import TenantAgreement
from httpx import AsyncClient
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

BASE = "/api/v1"


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _generate_url(tenant_public_id: str) -> str:
    return f"{BASE}/tenants/{tenant_public_id}/dues/generate"


def _list_url(tenant_public_id: str) -> str:
    return f"{BASE}/tenants/{tenant_public_id}/dues"


def _due_url(due_public_id: str) -> str:
    return f"{BASE}/dues/{due_public_id}"


# ── generate ──────────────────────────────────────────────────────────────────


async def test_generate_due_success(client: AsyncClient, auth_token: str, test_tenant: dict):
    """Generating a due snapshots rent_amount and sets status=unpaid."""
    t_pid = test_tenant["public_id"]
    resp = await client.post(
        _generate_url(t_pid),
        json={"month": 3, "year": 2024, "due_date": "2024-03-05"},
        headers=_auth(auth_token),
    )
    assert resp.status_code == 201
    due = resp.json()["data"]
    assert due["month"] == 3
    assert due["year"] == 2024
    assert due["status"] == "unpaid"
    assert due["rent_amount"] == "10000.00"
    assert due["total_due"] == "10000.00"
    assert due["amount_paid"] == "0.00"
    assert due["remaining_balance"] == "10000.00"
    assert due["due_date"] == "2024-03-05"
    assert due["tenant_public_id"] == t_pid
    assert "agreement_public_id" in due


async def test_generate_due_duplicate(client: AsyncClient, auth_token: str, test_tenant: dict):
    """Generating the same month/year twice returns 400."""
    t_pid = test_tenant["public_id"]
    await client.post(
        _generate_url(t_pid), json={"month": 4, "year": 2024}, headers=_auth(auth_token)
    )
    resp = await client.post(
        _generate_url(t_pid), json={"month": 4, "year": 2024}, headers=_auth(auth_token)
    )
    assert resp.status_code == 400


async def test_generate_due_no_agreement(
    client: AsyncClient,
    auth_token: str,
    test_tenant: dict,
    db: AsyncSession,
):
    """Generating a due when the tenant has no active agreement returns 400."""
    from app.models.tenant import Tenant
    from sqlalchemy import select

    result = await db.execute(select(Tenant.id).where(Tenant.public_id == test_tenant["public_id"]))
    tenant_id = result.scalar_one()

    # Close the active agreement directly — bypasses API to create the edge case
    await db.execute(
        update(TenantAgreement)
        .where(
            TenantAgreement.tenant_id == tenant_id,
            TenantAgreement.is_active.is_(True),
        )
        .values(is_active=False, end_date=date(2024, 1, 31))
    )

    resp = await client.post(
        _generate_url(test_tenant["public_id"]),
        json={"month": 2, "year": 2024},
        headers=_auth(auth_token),
    )
    assert resp.status_code == 400


async def test_generate_due_wrong_owner(client: AsyncClient, auth_token: str, test_tenant: dict):
    """A second owner cannot generate a due for a tenant they do not own."""
    resp2 = await client.post(
        f"{BASE}/auth/register",
        json={"full_name": "Owner 2", "email": "owner2due@example.com", "password": "password123"},
    )
    token2 = resp2.json()["data"]["access_token"]
    resp = await client.post(
        _generate_url(test_tenant["public_id"]),
        json={"month": 1, "year": 2024},
        headers=_auth(token2),
    )
    assert resp.status_code == 404


# ── list ──────────────────────────────────────────────────────────────────────


async def test_list_dues_success(client: AsyncClient, auth_token: str, test_tenant: dict):
    """Listing dues returns all generated dues for the tenant, newest first."""
    t_pid = test_tenant["public_id"]
    for month in [1, 2, 3]:
        await client.post(
            _generate_url(t_pid),
            json={"month": month, "year": 2024},
            headers=_auth(auth_token),
        )

    resp = await client.get(_list_url(t_pid), headers=_auth(auth_token))
    assert resp.status_code == 200
    body = resp.json()
    assert body["pagination"]["total"] == 3
    months = [d["month"] for d in body["data"]]
    assert months == [3, 2, 1]  # newest first


async def test_list_dues_status_filter(client: AsyncClient, auth_token: str, test_tenant: dict):
    """Status filter returns only dues matching the requested status."""
    t_pid = test_tenant["public_id"]
    r1 = await client.post(
        _generate_url(t_pid), json={"month": 1, "year": 2024}, headers=_auth(auth_token)
    )
    due1_pid = r1.json()["data"]["public_id"]
    await client.post(
        _generate_url(t_pid), json={"month": 2, "year": 2024}, headers=_auth(auth_token)
    )

    # Pay due1 in full
    await client.post(
        f"{BASE}/dues/{due1_pid}/payments",
        json={"amount": "10000.00", "paid_on": "2024-01-15"},
        headers=_auth(auth_token),
    )

    paid_resp = await client.get(
        _list_url(t_pid), params={"status": "paid"}, headers=_auth(auth_token)
    )
    assert paid_resp.json()["pagination"]["total"] == 1
    assert paid_resp.json()["data"][0]["status"] == "paid"

    unpaid_resp = await client.get(
        _list_url(t_pid), params={"status": "unpaid"}, headers=_auth(auth_token)
    )
    assert unpaid_resp.json()["pagination"]["total"] == 1
    assert unpaid_resp.json()["data"][0]["status"] == "unpaid"


# ── adjust ────────────────────────────────────────────────────────────────────


async def test_adjust_due_success(client: AsyncClient, auth_token: str, test_due: dict):
    """Adjusting total_due recalculates remaining_balance correctly."""
    due_pid = test_due["public_id"]
    resp = await client.put(
        _due_url(due_pid),
        json={"total_due": "12000.00"},
        headers=_auth(auth_token),
    )
    assert resp.status_code == 200
    due = resp.json()["data"]
    assert due["total_due"] == "12000.00"
    assert due["remaining_balance"] == "12000.00"
    assert due["amount_paid"] == "0.00"
    assert due["status"] == "unpaid"


async def test_adjust_due_partial_not_allowed(client: AsyncClient, auth_token: str, test_due: dict):
    """Adjusting a partially-paid due returns 400."""
    due_pid = test_due["public_id"]
    # Partial payment → status becomes 'partial'
    await client.post(
        f"{BASE}/dues/{due_pid}/payments",
        json={"amount": "3000.00", "paid_on": "2024-01-15"},
        headers=_auth(auth_token),
    )
    resp = await client.put(
        _due_url(due_pid),
        json={"total_due": "12000.00"},
        headers=_auth(auth_token),
    )
    assert resp.status_code == 400


async def test_adjust_due_paid_not_allowed(client: AsyncClient, auth_token: str, test_due: dict):
    """Adjusting a fully-paid due returns 400."""
    due_pid = test_due["public_id"]
    await client.post(
        f"{BASE}/dues/{due_pid}/payments",
        json={"amount": "10000.00", "paid_on": "2024-01-15"},
        headers=_auth(auth_token),
    )
    resp = await client.put(
        _due_url(due_pid),
        json={"total_due": "12000.00"},
        headers=_auth(auth_token),
    )
    assert resp.status_code == 400


async def test_adjust_due_due_date(client: AsyncClient, auth_token: str, test_due: dict):
    """Adjusting only due_date leaves amounts unchanged."""
    due_pid = test_due["public_id"]
    resp = await client.put(
        _due_url(due_pid),
        json={"due_date": "2024-01-20"},
        headers=_auth(auth_token),
    )
    assert resp.status_code == 200
    due = resp.json()["data"]
    assert due["due_date"] == "2024-01-20"
    assert due["total_due"] == "10000.00"
    assert due["remaining_balance"] == "10000.00"
