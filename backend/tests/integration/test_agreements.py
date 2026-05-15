"""Integration tests for tenant agreements and bulk rent adjustment endpoints."""

from httpx import AsyncClient

BASE = "/api/v1"


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _agreements_url(tenant_public_id: str) -> str:
    return f"{BASE}/tenants/{tenant_public_id}/agreements"


# ── list ──────────────────────────────────────────────────────────────────────


async def test_list_agreements_success(client: AsyncClient, auth_token: str, test_tenant: dict):
    """A newly-created tenant has exactly one agreement from their move-in."""
    resp = await client.get(_agreements_url(test_tenant["public_id"]), headers=_auth(auth_token))
    assert resp.status_code == 200
    agreements = resp.json()["data"]
    assert len(agreements) == 1
    assert agreements[0]["is_active"] is True
    assert agreements[0]["end_date"] is None


async def test_list_agreements_multiple(client: AsyncClient, auth_token: str, test_tenant: dict):
    """After a rent change, list returns both the old (closed) and new agreement."""
    t_pid = test_tenant["public_id"]
    await client.post(
        _agreements_url(t_pid),
        json={"rent_amount": "12000.00", "start_date": "2024-07-01"},
        headers=_auth(auth_token),
    )
    resp = await client.get(_agreements_url(t_pid), headers=_auth(auth_token))
    agreements = resp.json()["data"]
    assert len(agreements) == 2
    # Ordered newest first
    assert agreements[0]["rent_amount"] == "12000.00"
    assert agreements[0]["is_active"] is True
    assert agreements[1]["is_active"] is False


# ── create ────────────────────────────────────────────────────────────────────


async def test_create_agreement_success(client: AsyncClient, auth_token: str, test_tenant: dict):
    """Creating a new agreement closes the previous one and sets its end_date."""
    t_pid = test_tenant["public_id"]
    resp = await client.post(
        _agreements_url(t_pid),
        json={"rent_amount": "11000.00", "start_date": "2024-07-01"},
        headers=_auth(auth_token),
    )
    assert resp.status_code == 201
    new_ag = resp.json()["data"]
    assert new_ag["rent_amount"] == "11000.00"
    assert new_ag["is_active"] is True
    assert new_ag["end_date"] is None

    # Old agreement should now be closed
    list_resp = await client.get(_agreements_url(t_pid), headers=_auth(auth_token))
    agreements = list_resp.json()["data"]
    old = next(a for a in agreements if a["public_id"] != new_ag["public_id"])
    assert old["is_active"] is False
    assert old["end_date"] == "2024-06-30"


async def test_create_agreement_start_date_not_after_current(
    client: AsyncClient, auth_token: str, test_tenant: dict
):
    """start_date must be strictly after the current agreement's start_date."""
    t_pid = test_tenant["public_id"]
    # Initial agreement start_date is 2024-01-01; same date is rejected
    resp = await client.post(
        _agreements_url(t_pid),
        json={"rent_amount": "11000.00", "start_date": "2024-01-01"},
        headers=_auth(auth_token),
    )
    assert resp.status_code == 400


async def test_create_agreement_wrong_owner(
    client: AsyncClient, auth_token: str, test_tenant: dict
):
    """A second owner cannot create an agreement for a tenant they do not own."""
    resp2 = await client.post(
        f"{BASE}/auth/register",
        json={"full_name": "Owner 2", "email": "owner2ag@example.com", "password": "password123"},
    )
    token2 = resp2.json()["data"]["access_token"]
    resp = await client.post(
        _agreements_url(test_tenant["public_id"]),
        json={"rent_amount": "11000.00", "start_date": "2024-07-01"},
        headers=_auth(token2),
    )
    assert resp.status_code == 404


async def test_create_agreement_inactive_tenant(
    client: AsyncClient,
    auth_token: str,
    test_tenant: dict,
    test_apartment: dict,
):
    """Moved-out tenant cannot receive a new agreement (returns 404)."""
    apt_pid = test_apartment["public_id"]
    t_pid = test_tenant["public_id"]
    # Move the tenant out first
    await client.request(
        "DELETE",
        f"{BASE}/apartments/{apt_pid}/tenants/{t_pid}",
        json={"move_out_date": "2024-06-30"},
        headers=_auth(auth_token),
    )
    resp = await client.post(
        _agreements_url(t_pid),
        json={"rent_amount": "11000.00", "start_date": "2024-07-01"},
        headers=_auth(auth_token),
    )
    assert resp.status_code == 404


# ── bulk adjust ───────────────────────────────────────────────────────────────


async def test_bulk_adjust_rent_fixed(client: AsyncClient, auth_token: str, test_tenant: dict):
    """Fixed adjustment adds the exact amount to every tenant's rent."""
    resp = await client.post(
        f"{BASE}/agreements/bulk-adjust",
        json={
            "adjustment_type": "fixed",
            "amount": "1500.00",
            "scope": "all",
            "effective_date": "2025-01-01",
        },
        headers=_auth(auth_token),
    )
    assert resp.status_code == 201
    result = resp.json()["data"]
    assert result["tenants_adjusted"] == 1
    assert result["new_agreements"][0]["rent_amount"] == "11500.00"  # 10000 + 1500


async def test_bulk_adjust_rent_percentage(client: AsyncClient, auth_token: str, test_tenant: dict):
    """Percentage adjustment multiplies each rent by (1 + pct/100), rounded to 2dp."""
    resp = await client.post(
        f"{BASE}/agreements/bulk-adjust",
        json={
            "adjustment_type": "percentage",
            "amount": "10",
            "scope": "all",
            "effective_date": "2025-01-01",
        },
        headers=_auth(auth_token),
    )
    assert resp.status_code == 201
    result = resp.json()["data"]
    assert result["tenants_adjusted"] == 1
    assert result["new_agreements"][0]["rent_amount"] == "11000.00"  # 10000 * 1.10


async def test_bulk_adjust_rent_building_scope(
    client: AsyncClient, auth_token: str, test_tenant: dict, test_building: dict
):
    """Building-scoped adjustment only affects tenants in the specified building."""
    # Create a second building with its own tenant
    b2 = await client.post(
        f"{BASE}/buildings",
        json={"name": "Building B", "address": "2 Other St", "total_floors": 2},
        headers=_auth(auth_token),
    )
    b2_pid = b2.json()["data"]["public_id"]
    a2 = await client.post(
        f"{BASE}/buildings/{b2_pid}/apartments",
        json={"unit_number": "201", "floor": 2},
        headers=_auth(auth_token),
    )
    a2_pid = a2.json()["data"]["public_id"]
    t2 = await client.post(
        f"{BASE}/apartments/{a2_pid}/tenants",
        json={
            "full_name": "Building B Tenant",
            "phone": "01900000000",
            "move_in_date": "2024-01-01",
            "initial_rent_amount": "20000.00",
            "agreement_start_date": "2024-01-01",
        },
        headers=_auth(auth_token),
    )
    t2_pid = t2.json()["data"]["public_id"]

    # Adjust only test_building
    resp = await client.post(
        f"{BASE}/agreements/bulk-adjust",
        json={
            "adjustment_type": "fixed",
            "amount": "500.00",
            "scope": "building",
            "building_public_id": test_building["public_id"],
            "effective_date": "2025-01-01",
        },
        headers=_auth(auth_token),
    )
    assert resp.status_code == 201
    assert resp.json()["data"]["tenants_adjusted"] == 1

    # test_tenant rent → 10500
    t1_list = await client.get(_agreements_url(test_tenant["public_id"]), headers=_auth(auth_token))
    t1_active = next(a for a in t1_list.json()["data"] if a["is_active"])
    assert t1_active["rent_amount"] == "10500.00"

    # Building B tenant rent unchanged → 20000
    t2_list = await client.get(_agreements_url(t2_pid), headers=_auth(auth_token))
    t2_active = next(a for a in t2_list.json()["data"] if a["is_active"])
    assert t2_active["rent_amount"] == "20000.00"
