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


async def test_adjust_due_zero_total_due_rejected(
    client: AsyncClient, auth_token: str, test_due: dict
):
    """Setting total_due to 0 is rejected with a validation error."""
    due_pid = test_due["public_id"]
    resp = await client.put(
        _due_url(due_pid),
        json={"total_due": "0"},
        headers=_auth(auth_token),
    )
    # Pydantic rejects total_due=0 (gt=0 constraint) → 422
    assert resp.status_code == 422


# ── bulk generate ─────────────────────────────────────────────────────────────


def _pending_count_url() -> str:
    return f"{BASE}/dues/pending-count"


def _bulk_generate_url() -> str:
    return f"{BASE}/dues/generate-bulk"


async def test_pending_due_count_has_pending(
    client: AsyncClient, auth_token: str, test_tenant: dict
):
    """Pending count shows 1 tenant needing a due for a month with no dues."""
    resp = await client.get(
        _pending_count_url(),
        params={"month": 3, "year": 2024},
        headers=_auth(auth_token),
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["pending"] >= 1
    assert data["month"] == 3
    assert data["year"] == 2024


async def test_generate_bulk_success(client: AsyncClient, auth_token: str, test_tenant: dict):
    """Bulk generate creates dues for all pending tenants."""
    resp = await client.post(
        _bulk_generate_url(),
        json={"month": 3, "year": 2024},
        headers=_auth(auth_token),
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["created"] >= 1
    assert "skipped" in data
    assert "no_agreement" in data


async def test_generate_bulk_idempotent(client: AsyncClient, auth_token: str, test_tenant: dict):
    """Second bulk generate for the same month creates 0 new dues."""
    # First call
    await client.post(
        _bulk_generate_url(),
        json={"month": 4, "year": 2024},
        headers=_auth(auth_token),
    )
    # Second call — should skip all
    resp = await client.post(
        _bulk_generate_url(),
        json={"month": 4, "year": 2024},
        headers=_auth(auth_token),
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["created"] == 0
    assert data["skipped"] >= 1


async def test_pending_count_zero_after_generation(
    client: AsyncClient, auth_token: str, test_tenant: dict
):
    """After generating dues for a month, pending count is 0."""
    await client.post(
        _bulk_generate_url(),
        json={"month": 5, "year": 2024},
        headers=_auth(auth_token),
    )
    resp = await client.get(
        _pending_count_url(),
        params={"month": 5, "year": 2024},
        headers=_auth(auth_token),
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["pending"] == 0


async def test_generate_bulk_with_due_date(client: AsyncClient, auth_token: str, test_tenant: dict):
    """Bulk generate with explicit due_date sets it on all created dues."""
    resp = await client.post(
        _bulk_generate_url(),
        json={"month": 6, "year": 2024, "due_date": "2024-06-15"},
        headers=_auth(auth_token),
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["created"] >= 1

    # Verify the created due has the custom due_date
    list_resp = await client.get(
        _list_url(test_tenant["public_id"]),
        params={"year": 2024, "status": "unpaid"},
        headers=_auth(auth_token),
    )
    dues = list_resp.json()["data"]
    june_due = next((d for d in dues if d["month"] == 6), None)
    assert june_due is not None
    assert june_due["due_date"] == "2024-06-15"


async def test_generate_bulk_wrong_owner(client: AsyncClient, auth_token: str, test_tenant: dict):
    """A second owner's bulk generate does not affect the first owner's tenants."""
    resp2 = await client.post(
        f"{BASE}/auth/register",
        json={
            "full_name": "Owner Bulk",
            "email": "ownerbulk@example.com",
            "password": "password123",
        },
    )
    token2 = resp2.json()["data"]["access_token"]

    # Second owner sees zero pending
    resp = await client.get(
        _pending_count_url(),
        params={"month": 7, "year": 2024},
        headers=_auth(token2),
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["pending"] == 0

    # Second owner bulk generates — creates nothing
    resp = await client.post(
        _bulk_generate_url(),
        json={"month": 7, "year": 2024},
        headers=_auth(token2),
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["created"] == 0
