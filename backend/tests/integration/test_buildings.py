"""Integration tests for /api/v1/buildings endpoints."""

from httpx import AsyncClient

BASE = "/api/v1/buildings"


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _building_payload(**overrides) -> dict:
    base = {"name": "Sunrise Towers", "address": "42 Main St", "total_floors": 5}
    return {**base, **overrides}


# ── create ────────────────────────────────────────────────────────────────────


async def test_create_building_success(client: AsyncClient, auth_token: str):
    """Valid payload creates a building and returns 201."""
    resp = await client.post(BASE, json=_building_payload(), headers=_auth(auth_token))
    assert resp.status_code == 201
    data = resp.json()["data"]
    assert data["name"] == "Sunrise Towers"
    assert data["total_floors"] == 5
    assert "public_id" in data


async def test_create_building_unauthenticated(client: AsyncClient):
    """Request without a token is rejected with 403."""
    resp = await client.post(BASE, json=_building_payload())
    assert resp.status_code in (401, 403)


async def test_create_building_missing_fields(client: AsyncClient, auth_token: str):
    """Missing required field returns 422."""
    resp = await client.post(BASE, json={"address": "No Name St"}, headers=_auth(auth_token))
    assert resp.status_code == 422


async def test_create_building_invalid_total_floors(client: AsyncClient, auth_token: str):
    """total_floors < 1 returns 422."""
    resp = await client.post(
        BASE, json=_building_payload(total_floors=0), headers=_auth(auth_token)
    )
    assert resp.status_code == 422


# ── list ──────────────────────────────────────────────────────────────────────


async def test_list_buildings_empty(client: AsyncClient, auth_token: str):
    """A new owner with no buildings returns an empty list."""
    resp = await client.get(BASE, headers=_auth(auth_token))
    assert resp.status_code == 200
    body = resp.json()
    assert body["data"] == []
    assert body["pagination"]["total"] == 0


async def test_list_buildings_pagination(client: AsyncClient, auth_token: str):
    """Creating 25 buildings is reflected correctly in paginated responses."""
    for i in range(25):
        await client.post(
            BASE,
            json=_building_payload(name=f"Building {i}"),
            headers=_auth(auth_token),
        )

    page1 = await client.get(BASE, params={"page": 1, "page_size": 10}, headers=_auth(auth_token))
    assert page1.status_code == 200
    body1 = page1.json()
    assert len(body1["data"]) == 10
    assert body1["pagination"]["total"] == 25

    page3 = await client.get(BASE, params={"page": 3, "page_size": 10}, headers=_auth(auth_token))
    assert len(page3.json()["data"]) == 5


# ── get ───────────────────────────────────────────────────────────────────────


async def test_get_building_success(client: AsyncClient, auth_token: str, test_building: dict):
    """GET by public_id returns the correct building."""
    pid = test_building["public_id"]
    resp = await client.get(f"{BASE}/{pid}", headers=_auth(auth_token))
    assert resp.status_code == 200
    assert resp.json()["data"]["public_id"] == pid


async def test_get_building_not_found(client: AsyncClient, auth_token: str):
    """Unknown public_id returns 404."""
    resp = await client.get(
        f"{BASE}/00000000-0000-0000-0000-000000000000", headers=_auth(auth_token)
    )
    assert resp.status_code == 404


async def test_get_building_wrong_owner(client: AsyncClient, auth_token: str, test_building: dict):
    """A second owner cannot access buildings owned by the first owner."""
    # Register second owner
    resp2 = await client.post(
        "/api/v1/auth/register",
        json={"full_name": "Owner 2", "email": "owner2@example.com", "password": "password123"},
    )
    token2 = resp2.json()["data"]["access_token"]

    pid = test_building["public_id"]
    resp = await client.get(f"{BASE}/{pid}", headers=_auth(token2))
    assert resp.status_code == 404


# ── update ────────────────────────────────────────────────────────────────────


async def test_update_building_success(client: AsyncClient, auth_token: str, test_building: dict):
    """Partial update modifies only the supplied fields."""
    pid = test_building["public_id"]
    resp = await client.put(
        f"{BASE}/{pid}",
        json={"name": "Updated Name"},
        headers=_auth(auth_token),
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["name"] == "Updated Name"
    assert resp.json()["data"]["total_floors"] == test_building["total_floors"]


async def test_update_building_wrong_owner(
    client: AsyncClient, auth_token: str, test_building: dict
):
    """A second owner cannot update a building they do not own."""
    resp2 = await client.post(
        "/api/v1/auth/register",
        json={"full_name": "Owner 2", "email": "owner2b@example.com", "password": "password123"},
    )
    token2 = resp2.json()["data"]["access_token"]

    pid = test_building["public_id"]
    resp = await client.put(f"{BASE}/{pid}", json={"name": "Hijack"}, headers=_auth(token2))
    assert resp.status_code == 404


# ── delete ────────────────────────────────────────────────────────────────────


async def test_delete_building_success(client: AsyncClient, auth_token: str):
    """Deactivating a building with no apartments returns 200."""
    create_resp = await client.post(
        BASE, json=_building_payload(name="To Delete"), headers=_auth(auth_token)
    )
    pid = create_resp.json()["data"]["public_id"]

    resp = await client.delete(f"{BASE}/{pid}", headers=_auth(auth_token))
    assert resp.status_code == 200

    get_resp = await client.get(f"{BASE}/{pid}", headers=_auth(auth_token))
    assert get_resp.status_code == 404


async def test_delete_building_with_apartments(
    client: AsyncClient, auth_token: str, test_building: dict, test_apartment: dict
):
    """Deleting a building that has active apartments returns 400."""
    pid = test_building["public_id"]
    resp = await client.delete(f"{BASE}/{pid}", headers=_auth(auth_token))
    assert resp.status_code == 400
