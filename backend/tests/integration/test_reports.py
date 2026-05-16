"""Integration tests for payment history and overdue list reports."""

from httpx import AsyncClient

BASE = "/api/v1"


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ── payment history ───────────────────────────────────────────────────────────


async def test_payment_history_success(
    client: AsyncClient, auth_token: str, test_tenant: dict, test_due: dict
):
    """Payment history returns each due with its nested payment records."""
    due_pid = test_due["public_id"]
    await client.post(
        f"{BASE}/dues/{due_pid}/payments",
        json={"amount": "4000.00", "paid_on": "2024-01-12"},
        headers=_auth(auth_token),
    )

    resp = await client.get(
        f"{BASE}/reports/payment-history",
        params={"tenant_public_id": test_tenant["public_id"]},
        headers=_auth(auth_token),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["pagination"]["total"] == 1

    due_row = body["data"][0]
    assert due_row["due_public_id"] == due_pid
    assert due_row["month"] == 1
    assert due_row["year"] == 2024
    assert due_row["status"] == "partial"
    assert len(due_row["payments"]) == 1
    assert due_row["payments"][0]["amount_paid"] == "4000.00"


async def test_payment_history_empty(client: AsyncClient, auth_token: str, test_tenant: dict):
    """A tenant with no dues generated has an empty payment history."""
    resp = await client.get(
        f"{BASE}/reports/payment-history",
        params={"tenant_public_id": test_tenant["public_id"]},
        headers=_auth(auth_token),
    )
    assert resp.status_code == 200
    assert resp.json()["pagination"]["total"] == 0
    assert resp.json()["data"] == []


async def test_payment_history_pagination(client: AsyncClient, auth_token: str, test_tenant: dict):
    """Pagination limits and counts dues correctly in payment history."""
    t_pid = test_tenant["public_id"]
    for month in range(1, 6):  # 5 dues
        await client.post(
            f"{BASE}/tenants/{t_pid}/dues/generate",
            json={"month": month, "year": 2024},
            headers=_auth(auth_token),
        )

    resp = await client.get(
        f"{BASE}/reports/payment-history",
        params={"tenant_public_id": t_pid, "page": 1, "page_size": 2},
        headers=_auth(auth_token),
    )
    body = resp.json()
    assert body["pagination"]["total"] == 5
    assert len(body["data"]) == 2


async def test_payment_history_wrong_owner(client: AsyncClient, auth_token: str, test_tenant: dict):
    """A second owner cannot access the payment history of a tenant they do not own."""
    resp2 = await client.post(
        f"{BASE}/auth/register",
        json={"full_name": "Owner 2", "email": "owner2rep@example.com", "password": "password123"},
    )
    token2 = resp2.json()["data"]["access_token"]

    resp = await client.get(
        f"{BASE}/reports/payment-history",
        params={"tenant_public_id": test_tenant["public_id"]},
        headers=_auth(token2),
    )
    assert resp.status_code == 404


# ── overdue list ──────────────────────────────────────────────────────────────


async def test_overdue_list_empty(client: AsyncClient, auth_token: str):
    """Owner with no dues returns an empty overdue list."""
    resp = await client.get(f"{BASE}/reports/overdue-list", headers=_auth(auth_token))
    assert resp.status_code == 200
    assert resp.json()["data"] == []


async def test_overdue_list_with_overdue(
    client: AsyncClient, auth_token: str, test_due: dict, test_tenant: dict
):
    """An unpaid due whose due_date is in the past appears in the overdue list."""
    # test_due has due_date=2024-01-10, status=unpaid → overdue since today is 2026-05-15
    resp = await client.get(f"{BASE}/reports/overdue-list", headers=_auth(auth_token))
    assert resp.status_code == 200
    items = resp.json()["data"]
    assert len(items) == 1

    item = items[0]
    assert item["due_public_id"] == test_due["public_id"]
    assert item["status"] == "unpaid"
    assert item["days_overdue"] > 0
    assert item["tenant_name"] == "Jane Doe"
    assert "apartment_unit" in item
    assert "building_name" in item


async def test_overdue_list_excludes_paid(client: AsyncClient, auth_token: str, test_due: dict):
    """Fully-paid dues do not appear in the overdue list even if past due_date."""
    due_pid = test_due["public_id"]
    await client.post(
        f"{BASE}/dues/{due_pid}/payments",
        json={"amount": "10000.00", "paid_on": "2024-01-15"},
        headers=_auth(auth_token),
    )

    resp = await client.get(f"{BASE}/reports/overdue-list", headers=_auth(auth_token))
    assert resp.status_code == 200
    assert resp.json()["data"] == []


async def test_overdue_list_excludes_future_due_date(
    client: AsyncClient, auth_token: str, test_tenant: dict
):
    """Dues with a future due_date are not overdue and must not appear in the list."""
    t_pid = test_tenant["public_id"]
    await client.post(
        f"{BASE}/tenants/{t_pid}/dues/generate",
        json={"month": 12, "year": 2099, "due_date": "2099-12-01"},
        headers=_auth(auth_token),
    )

    resp = await client.get(f"{BASE}/reports/overdue-list", headers=_auth(auth_token))
    assert resp.status_code == 200
    assert resp.json()["data"] == []


async def test_overdue_list_isolation(client: AsyncClient, auth_token: str, test_due: dict):
    """A second owner's overdue list does not include another owner's dues."""
    resp2 = await client.post(
        f"{BASE}/auth/register",
        json={"full_name": "Owner 2", "email": "owner2ov@example.com", "password": "password123"},
    )
    token2 = resp2.json()["data"]["access_token"]

    resp = await client.get(f"{BASE}/reports/overdue-list", headers=_auth(token2))
    assert resp.status_code == 200
    assert resp.json()["data"] == []


# ── annual summary ────────────────────────────────────────────────────────────


async def test_annual_summary_fields(client: AsyncClient, auth_token: str):
    """Annual summary endpoint returns the expected fields."""
    resp = await client.get(
        f"{BASE}/reports/annual-summary",
        params={"year": 2024},
        headers=_auth(auth_token),
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "year" in data
    assert "total_collected" in data
    assert "total_expenses" in data
    assert "net_profit" in data
    assert "total_outstanding" in data
    assert data["year"] == 2024


async def test_annual_summary_aggregates_all_months(
    client: AsyncClient, auth_token: str, test_tenant: dict
):
    """Annual summary sums payments across all months of the requested year."""
    t_pid = test_tenant["public_id"]

    # Generate dues for Jan and Feb 2024 and pay both
    r1 = await client.post(
        f"{BASE}/tenants/{t_pid}/dues/generate",
        json={"month": 1, "year": 2024},
        headers=_auth(auth_token),
    )
    due1_pid = r1.json()["data"]["public_id"]

    r2 = await client.post(
        f"{BASE}/tenants/{t_pid}/dues/generate",
        json={"month": 2, "year": 2024},
        headers=_auth(auth_token),
    )
    due2_pid = r2.json()["data"]["public_id"]

    await client.post(
        f"{BASE}/dues/{due1_pid}/payments",
        json={"amount": "6000.00", "paid_on": "2024-01-15"},
        headers=_auth(auth_token),
    )
    await client.post(
        f"{BASE}/dues/{due2_pid}/payments",
        json={"amount": "4000.00", "paid_on": "2024-02-10"},
        headers=_auth(auth_token),
    )

    resp = await client.get(
        f"{BASE}/reports/annual-summary",
        params={"year": 2024},
        headers=_auth(auth_token),
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["total_collected"] == "10000.00"


async def test_annual_summary_excludes_other_year(
    client: AsyncClient, auth_token: str, test_tenant: dict
):
    """Annual summary for year X does not count payments made in year Y."""
    t_pid = test_tenant["public_id"]
    r = await client.post(
        f"{BASE}/tenants/{t_pid}/dues/generate",
        json={"month": 6, "year": 2023},
        headers=_auth(auth_token),
    )
    due_pid = r.json()["data"]["public_id"]
    await client.post(
        f"{BASE}/dues/{due_pid}/payments",
        json={"amount": "5000.00", "paid_on": "2023-06-01"},
        headers=_auth(auth_token),
    )

    resp = await client.get(
        f"{BASE}/reports/annual-summary",
        params={"year": 2024},
        headers=_auth(auth_token),
    )
    assert resp.status_code == 200
    from decimal import Decimal

    assert Decimal(str(resp.json()["data"]["total_collected"])) == Decimal("0")


async def test_annual_summary_invalid_year(client: AsyncClient, auth_token: str):
    """Requesting an out-of-range year returns a validation error."""
    resp = await client.get(
        f"{BASE}/reports/annual-summary",
        params={"year": 1999},
        headers=_auth(auth_token),
    )
    assert resp.status_code == 422
