"""Integration tests for /api/v1/buildings/{id}/apartments endpoints."""

from httpx import AsyncClient


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _apt_url(building_public_id: str) -> str:
    return f"/api/v1/buildings/{building_public_id}/apartments"


def _apt_payload(**overrides) -> dict:
    base = {"unit_number": "A101", "floor": 1}
    return {**base, **overrides}


# ── create ────────────────────────────────────────────────────────────────────


async def test_create_apartment_success(client: AsyncClient, auth_token: str, test_building: dict):
    """Valid payload creates an apartment and returns 201."""
    url = _apt_url(test_building["public_id"])
    resp = await client.post(url, json=_apt_payload(), headers=_auth(auth_token))
    assert resp.status_code == 201
    data = resp.json()["data"]
    assert data["unit_number"] == "A101"
    assert data["floor"] == 1
    assert data["status"] == "vacant"
    assert data["building_public_id"] == test_building["public_id"]


async def test_create_apartment_duplicate_unit(
    client: AsyncClient, auth_token: str, test_building: dict
):
    """Creating two apartments with the same unit_number in the same building returns 400."""
    url = _apt_url(test_building["public_id"])
    await client.post(url, json=_apt_payload(unit_number="DUP"), headers=_auth(auth_token))
    resp = await client.post(url, json=_apt_payload(unit_number="DUP"), headers=_auth(auth_token))
    assert resp.status_code == 400


async def test_create_apartment_wrong_owner(
    client: AsyncClient, auth_token: str, test_building: dict
):
    """A second owner cannot add an apartment to a building they do not own."""
    resp2 = await client.post(
        "/api/v1/auth/register",
        json={"full_name": "Attacker", "email": "attacker@example.com", "password": "password123"},
    )
    token2 = resp2.json()["data"]["access_token"]

    url = _apt_url(test_building["public_id"])
    resp = await client.post(url, json=_apt_payload(unit_number="X99"), headers=_auth(token2))
    assert resp.status_code == 404


async def test_create_apartment_invalid_floor(
    client: AsyncClient, auth_token: str, test_building: dict
):
    """Floor number < 1 returns 422."""
    url = _apt_url(test_building["public_id"])
    resp = await client.post(url, json=_apt_payload(floor=0), headers=_auth(auth_token))
    assert resp.status_code == 422


# ── list ──────────────────────────────────────────────────────────────────────


async def test_list_apartments_empty(client: AsyncClient, auth_token: str, test_building: dict):
    """A building with no apartments returns an empty list."""
    url = _apt_url(test_building["public_id"])
    resp = await client.get(url, headers=_auth(auth_token))
    assert resp.status_code == 200
    assert resp.json()["data"] == []


async def test_list_apartments_with_status_filter(
    client: AsyncClient, auth_token: str, test_building: dict
):
    """Status filter returns only apartments matching the requested status."""
    url = _apt_url(test_building["public_id"])
    await client.post(
        url, json=_apt_payload(unit_number="V1", status="vacant"), headers=_auth(auth_token)
    )
    await client.post(
        url, json=_apt_payload(unit_number="V2", status="vacant"), headers=_auth(auth_token)
    )
    # occupied apartments are created explicitly via the apartments endpoint
    await client.post(
        url, json=_apt_payload(unit_number="O1", status="occupied"), headers=_auth(auth_token)
    )

    vacant_resp = await client.get(url, params={"status": "vacant"}, headers=_auth(auth_token))
    assert vacant_resp.status_code == 200
    assert all(a["status"] == "vacant" for a in vacant_resp.json()["data"])

    occupied_resp = await client.get(url, params={"status": "occupied"}, headers=_auth(auth_token))
    assert all(a["status"] == "occupied" for a in occupied_resp.json()["data"])


# ── get ───────────────────────────────────────────────────────────────────────


async def test_get_apartment_success(client: AsyncClient, auth_token: str, test_apartment: dict):
    """GET by public_id returns the correct apartment."""
    bid = test_apartment["building_public_id"]
    pid = test_apartment["public_id"]
    resp = await client.get(f"/api/v1/buildings/{bid}/apartments/{pid}", headers=_auth(auth_token))
    assert resp.status_code == 200
    assert resp.json()["data"]["public_id"] == pid


async def test_get_apartment_not_found(client: AsyncClient, auth_token: str, test_building: dict):
    """Unknown apartment public_id returns 404."""
    bid = test_building["public_id"]
    resp = await client.get(
        f"/api/v1/buildings/{bid}/apartments/00000000-0000-0000-0000-000000000000",
        headers=_auth(auth_token),
    )
    assert resp.status_code == 404


# ── delete ────────────────────────────────────────────────────────────────────


async def test_delete_apartment_success(client: AsyncClient, auth_token: str, test_building: dict):
    """Deactivating a vacant apartment with no tenants returns 200."""
    bid = test_building["public_id"]
    url = _apt_url(bid)
    create_resp = await client.post(
        url, json=_apt_payload(unit_number="DEL1"), headers=_auth(auth_token)
    )
    pid = create_resp.json()["data"]["public_id"]

    resp = await client.delete(
        f"/api/v1/buildings/{bid}/apartments/{pid}", headers=_auth(auth_token)
    )
    assert resp.status_code == 200


async def test_delete_apartment_with_active_tenant(
    client: AsyncClient, auth_token: str, test_apartment: dict, test_tenant: dict
):
    """Deleting an apartment that has an active tenant returns 400."""
    bid = test_apartment["building_public_id"]
    pid = test_apartment["public_id"]
    resp = await client.delete(
        f"/api/v1/buildings/{bid}/apartments/{pid}", headers=_auth(auth_token)
    )
    assert resp.status_code == 400
