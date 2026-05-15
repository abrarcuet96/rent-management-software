"""Integration tests for the dashboard summary endpoint."""

from httpx import AsyncClient

BASE = "/api/v1"
SUMMARY_URL = f"{BASE}/dashboard/summary"


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ── structure ─────────────────────────────────────────────────────────────────


async def test_dashboard_summary_fields(client: AsyncClient, auth_token: str):
    """Response contains all expected summary keys with correct types."""
    resp = await client.get(SUMMARY_URL, headers=_auth(auth_token))
    assert resp.status_code == 200
    data = resp.json()["data"]
    expected_keys = {
        "month",
        "year",
        "total_collected",
        "total_outstanding",
        "vacant_apartments",
        "occupied_apartments",
        "total_apartments",
        "total_expenses",
        "net_profit",
    }
    assert expected_keys <= data.keys()
    assert isinstance(data["month"], int)
    assert isinstance(data["year"], int)


async def test_dashboard_defaults_to_current_month(client: AsyncClient, auth_token: str):
    """Omitting month/year returns summary for the current calendar month."""
    from datetime import date

    today = date.today()
    resp = await client.get(SUMMARY_URL, headers=_auth(auth_token))
    data = resp.json()["data"]
    assert data["month"] == today.month
    assert data["year"] == today.year


# ── total_collected ───────────────────────────────────────────────────────────


async def test_dashboard_total_collected(client: AsyncClient, auth_token: str, test_due: dict):
    """total_collected reflects payments whose paid_on falls in the queried month."""
    due_pid = test_due["public_id"]

    # Record a payment dated May 2026 (the month we'll query)
    await client.post(
        f"{BASE}/dues/{due_pid}/payments",
        json={"amount": "7500.00", "paid_on": "2026-05-10"},
        headers=_auth(auth_token),
    )

    resp = await client.get(
        SUMMARY_URL, params={"month": 5, "year": 2026}, headers=_auth(auth_token)
    )
    assert resp.status_code == 200
    assert float(resp.json()["data"]["total_collected"]) == 7500.0


async def test_dashboard_collected_excludes_other_month(
    client: AsyncClient, auth_token: str, test_due: dict
):
    """Payments from a different month are not counted in the queried month."""
    due_pid = test_due["public_id"]
    # Payment in April 2026 — should NOT appear in May 2026 total_collected
    await client.post(
        f"{BASE}/dues/{due_pid}/payments",
        json={"amount": "5000.00", "paid_on": "2026-04-01"},
        headers=_auth(auth_token),
    )

    resp = await client.get(
        SUMMARY_URL, params={"month": 5, "year": 2026}, headers=_auth(auth_token)
    )
    assert float(resp.json()["data"]["total_collected"]) == 0.0


# ── total_outstanding ─────────────────────────────────────────────────────────


async def test_dashboard_total_outstanding(client: AsyncClient, auth_token: str, test_tenant: dict):
    """total_outstanding includes all unpaid/partial dues regardless of month."""
    t_pid = test_tenant["public_id"]

    # Generate two unpaid dues
    await client.post(
        f"{BASE}/tenants/{t_pid}/dues/generate",
        json={"month": 1, "year": 2024},
        headers=_auth(auth_token),
    )
    await client.post(
        f"{BASE}/tenants/{t_pid}/dues/generate",
        json={"month": 2, "year": 2024},
        headers=_auth(auth_token),
    )

    resp = await client.get(SUMMARY_URL, headers=_auth(auth_token))
    outstanding = float(resp.json()["data"]["total_outstanding"])
    assert outstanding == 20000.0  # 2 × 10 000


async def test_dashboard_outstanding_excludes_paid(
    client: AsyncClient, auth_token: str, test_due: dict
):
    """Fully-paid dues do not contribute to total_outstanding."""
    due_pid = test_due["public_id"]
    await client.post(
        f"{BASE}/dues/{due_pid}/payments",
        json={"amount": "10000.00", "paid_on": "2024-01-15"},
        headers=_auth(auth_token),
    )

    resp = await client.get(SUMMARY_URL, headers=_auth(auth_token))
    assert float(resp.json()["data"]["total_outstanding"]) == 0.0


# ── vacancy count ─────────────────────────────────────────────────────────────


async def test_dashboard_vacancy_count(
    client: AsyncClient,
    auth_token: str,
    test_tenant: dict,
    test_apartment: dict,
    test_building: dict,
):
    """occupied_apartments and vacant_apartments reflect the current state."""
    # test_apartment is occupied (test_tenant lives there)
    # Create a second vacant apartment in the same building
    await client.post(
        f"{BASE}/buildings/{test_building['public_id']}/apartments",
        json={"unit_number": "102", "floor": 1},
        headers=_auth(auth_token),
    )

    resp = await client.get(SUMMARY_URL, headers=_auth(auth_token))
    data = resp.json()["data"]
    assert data["occupied_apartments"] == 1
    assert data["vacant_apartments"] == 1
    assert data["total_apartments"] == 2
