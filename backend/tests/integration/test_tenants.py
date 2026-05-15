"""Integration tests for /api/v1/apartments/{id}/tenants endpoints."""

from httpx import AsyncClient


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _tenant_url(apartment_public_id: str) -> str:
    return f"/api/v1/apartments/{apartment_public_id}/tenants"


def _tenant_detail_url(apartment_public_id: str, tenant_public_id: str) -> str:
    return f"/api/v1/apartments/{apartment_public_id}/tenants/{tenant_public_id}"


def _tenant_payload(**overrides) -> dict:
    base = {
        "full_name": "John Tenant",
        "phone": "01800000001",
        "move_in_date": "2024-03-01",
        "initial_rent_amount": "12000.00",
        "agreement_start_date": "2024-03-01",
    }
    return {**base, **overrides}


# ── add tenant ────────────────────────────────────────────────────────────────


async def test_add_tenant_success(client: AsyncClient, auth_token: str, test_apartment: dict):
    """Adding a tenant to a vacant apartment returns 201 and marks the apartment occupied."""
    apt_pid = test_apartment["public_id"]
    bid = test_apartment["building_public_id"]
    resp = await client.post(
        _tenant_url(apt_pid), json=_tenant_payload(), headers=_auth(auth_token)
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()["data"]
    assert data["full_name"] == "John Tenant"
    assert data["apartment_public_id"] == apt_pid
    assert data["is_active"] is True

    apt_resp = await client.get(
        f"/api/v1/buildings/{bid}/apartments/{apt_pid}", headers=_auth(auth_token)
    )
    assert apt_resp.json()["data"]["status"] == "occupied"


async def test_add_tenant_to_occupied_apartment(
    client: AsyncClient, auth_token: str, test_apartment: dict, test_tenant: dict
):
    """Adding a second tenant to an already-occupied apartment returns 400."""
    apt_pid = test_apartment["public_id"]
    resp = await client.post(
        _tenant_url(apt_pid),
        json=_tenant_payload(full_name="Second Tenant", phone="01800000002"),
        headers=_auth(auth_token),
    )
    assert resp.status_code == 400


async def test_add_tenant_wrong_owner(client: AsyncClient, auth_token: str, test_apartment: dict):
    """A second owner cannot add a tenant to an apartment they do not own."""
    resp2 = await client.post(
        "/api/v1/auth/register",
        json={"full_name": "Intruder", "email": "intruder@example.com", "password": "password123"},
    )
    token2 = resp2.json()["data"]["access_token"]

    apt_pid = test_apartment["public_id"]
    resp = await client.post(_tenant_url(apt_pid), json=_tenant_payload(), headers=_auth(token2))
    assert resp.status_code == 404


async def test_add_tenant_missing_required_field(
    client: AsyncClient, auth_token: str, test_apartment: dict
):
    """Missing move_in_date returns 422."""
    apt_pid = test_apartment["public_id"]
    payload = _tenant_payload()
    del payload["move_in_date"]
    resp = await client.post(_tenant_url(apt_pid), json=payload, headers=_auth(auth_token))
    assert resp.status_code == 422


# ── get tenant ────────────────────────────────────────────────────────────────


async def test_get_tenant_success(
    client: AsyncClient, auth_token: str, test_apartment: dict, test_tenant: dict
):
    """GET by tenant public_id returns the correct tenant."""
    apt_pid = test_apartment["public_id"]
    t_pid = test_tenant["public_id"]
    resp = await client.get(_tenant_detail_url(apt_pid, t_pid), headers=_auth(auth_token))
    assert resp.status_code == 200
    assert resp.json()["data"]["public_id"] == t_pid


# ── update tenant ─────────────────────────────────────────────────────────────


async def test_update_tenant_success(
    client: AsyncClient, auth_token: str, test_apartment: dict, test_tenant: dict
):
    """Partial update modifies only the supplied fields."""
    apt_pid = test_apartment["public_id"]
    t_pid = test_tenant["public_id"]
    resp = await client.put(
        _tenant_detail_url(apt_pid, t_pid),
        json={"full_name": "Updated Name", "phone": "01900000000"},
        headers=_auth(auth_token),
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["full_name"] == "Updated Name"
    assert data["phone"] == "01900000000"


async def test_update_tenant_wrong_owner(
    client: AsyncClient, auth_token: str, test_apartment: dict, test_tenant: dict
):
    """A second owner cannot update a tenant they do not own."""
    resp2 = await client.post(
        "/api/v1/auth/register",
        json={"full_name": "Owner X", "email": "ownerx@example.com", "password": "password123"},
    )
    token2 = resp2.json()["data"]["access_token"]

    apt_pid = test_apartment["public_id"]
    t_pid = test_tenant["public_id"]
    resp = await client.put(
        _tenant_detail_url(apt_pid, t_pid),
        json={"full_name": "Hijack"},
        headers=_auth(token2),
    )
    assert resp.status_code == 404


# ── move-out ──────────────────────────────────────────────────────────────────


async def test_mark_moved_out_success(
    client: AsyncClient, auth_token: str, test_tenant: dict, test_apartment: dict
):
    """Move-out sets move_out_date, deactivates the tenant, and vacates the apartment."""
    apt_pid = test_apartment["public_id"]
    bid = test_apartment["building_public_id"]
    t_pid = test_tenant["public_id"]
    resp = await client.request(
        "DELETE",
        _tenant_detail_url(apt_pid, t_pid),
        json={"move_out_date": "2024-12-31"},
        headers=_auth(auth_token),
    )
    assert resp.status_code == 200

    apt_resp = await client.get(
        f"/api/v1/buildings/{bid}/apartments/{apt_pid}",
        headers=_auth(auth_token),
    )
    assert apt_resp.json()["data"]["status"] == "vacant"


async def test_mark_moved_out_wrong_owner(
    client: AsyncClient, auth_token: str, test_apartment: dict, test_tenant: dict
):
    """A second owner cannot move out a tenant they do not own."""
    resp2 = await client.post(
        "/api/v1/auth/register",
        json={"full_name": "Owner Y", "email": "ownery@example.com", "password": "password123"},
    )
    token2 = resp2.json()["data"]["access_token"]

    apt_pid = test_apartment["public_id"]
    t_pid = test_tenant["public_id"]
    resp = await client.request(
        "DELETE",
        _tenant_detail_url(apt_pid, t_pid),
        json={"move_out_date": "2024-12-31"},
        headers=_auth(token2),
    )
    assert resp.status_code == 404
