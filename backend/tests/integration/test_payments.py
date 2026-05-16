"""Integration tests for single payments, bulk payments, and payment listing."""

from httpx import AsyncClient

BASE = "/api/v1"


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _payments_url(due_public_id: str) -> str:
    return f"{BASE}/dues/{due_public_id}/payments"


def _generate_due(client, auth_token, tenant_public_id, month, year):
    """Helper coroutine: generate a due and return its public_id."""
    return client.post(
        f"{BASE}/tenants/{tenant_public_id}/dues/generate",
        json={"month": month, "year": year},
        headers=_auth(auth_token),
    )


# ── single payment ────────────────────────────────────────────────────────────


async def test_record_payment_full(client: AsyncClient, auth_token: str, test_due: dict):
    """Paying the full remaining balance sets status to 'paid'."""
    due_pid = test_due["public_id"]
    resp = await client.post(
        _payments_url(due_pid),
        json={"amount": "10000.00", "paid_on": "2024-01-15"},
        headers=_auth(auth_token),
    )
    assert resp.status_code == 201
    due = resp.json()["data"]["due"]
    assert due["status"] == "paid"
    assert due["remaining_balance"] == "0.00"
    assert due["amount_paid"] == "10000.00"


async def test_record_payment_partial(client: AsyncClient, auth_token: str, test_due: dict):
    """Paying a partial amount sets status to 'partial' with correct balance."""
    due_pid = test_due["public_id"]
    resp = await client.post(
        _payments_url(due_pid),
        json={"amount": "4000.00", "paid_on": "2024-01-10"},
        headers=_auth(auth_token),
    )
    assert resp.status_code == 201
    due = resp.json()["data"]["due"]
    assert due["status"] == "partial"
    assert due["amount_paid"] == "4000.00"
    assert due["remaining_balance"] == "6000.00"


async def test_record_payment_overpayment(client: AsyncClient, auth_token: str, test_due: dict):
    """Amount exceeding remaining_balance returns 400."""
    due_pid = test_due["public_id"]
    resp = await client.post(
        _payments_url(due_pid),
        json={"amount": "99999.00", "paid_on": "2024-01-10"},
        headers=_auth(auth_token),
    )
    assert resp.status_code == 400


async def test_record_payment_already_paid(client: AsyncClient, auth_token: str, test_due: dict):
    """Recording a payment against an already-paid due returns 400."""
    due_pid = test_due["public_id"]
    await client.post(
        _payments_url(due_pid),
        json={"amount": "10000.00", "paid_on": "2024-01-10"},
        headers=_auth(auth_token),
    )
    resp = await client.post(
        _payments_url(due_pid),
        json={"amount": "1.00", "paid_on": "2024-01-11"},
        headers=_auth(auth_token),
    )
    assert resp.status_code == 400


async def test_record_payment_wrong_owner(client: AsyncClient, auth_token: str, test_due: dict):
    """A second owner cannot record a payment against a due they do not own."""
    resp2 = await client.post(
        f"{BASE}/auth/register",
        json={"full_name": "Owner 2", "email": "owner2pay@example.com", "password": "password123"},
    )
    token2 = resp2.json()["data"]["access_token"]
    resp = await client.post(
        _payments_url(test_due["public_id"]),
        json={"amount": "1000.00", "paid_on": "2024-01-10"},
        headers=_auth(token2),
    )
    assert resp.status_code == 404


async def test_record_two_partial_payments(client: AsyncClient, auth_token: str, test_due: dict):
    """Two partial payments that sum to the full amount result in status 'paid'."""
    due_pid = test_due["public_id"]
    await client.post(
        _payments_url(due_pid),
        json={"amount": "6000.00", "paid_on": "2024-01-10"},
        headers=_auth(auth_token),
    )
    resp = await client.post(
        _payments_url(due_pid),
        json={"amount": "4000.00", "paid_on": "2024-01-20"},
        headers=_auth(auth_token),
    )
    assert resp.status_code == 201
    due = resp.json()["data"]["due"]
    assert due["status"] == "paid"
    assert due["remaining_balance"] == "0.00"


# ── bulk payment ──────────────────────────────────────────────────────────────


async def test_bulk_payment_clears_oldest_first(
    client: AsyncClient, auth_token: str, test_tenant: dict
):
    """Bulk payment distributes oldest-first; newer dues remain unpaid if funds run out."""
    t_pid = test_tenant["public_id"]
    for month in [1, 2, 3]:
        await _generate_due(client, auth_token, t_pid, month, 2024)

    # Each due is 10 000; bulk-pay 20 000 → clears months 1 and 2, month 3 untouched
    resp = await client.post(
        f"{BASE}/payments/bulk",
        json={"tenant_public_id": t_pid, "total_amount": "20000.00", "paid_on": "2024-03-01"},
        headers=_auth(auth_token),
    )
    assert resp.status_code == 201
    result = resp.json()["data"]
    assert result["dues_cleared"] == 2
    assert result["dues_partially_paid"] == 0
    assert result["unapplied"] == "0.00"
    cleared_months = {u["month"] for u in result["dues_updated"]}
    assert cleared_months == {1, 2}


async def test_bulk_payment_partial_across_dues(
    client: AsyncClient, auth_token: str, test_tenant: dict
):
    """Bulk payment partially covering a second due leaves it in 'partial' status."""
    t_pid = test_tenant["public_id"]
    await _generate_due(client, auth_token, t_pid, 1, 2024)
    await _generate_due(client, auth_token, t_pid, 2, 2024)

    # 15 000 → clears month 1 (10 000) and partially pays month 2 (5 000 remaining)
    resp = await client.post(
        f"{BASE}/payments/bulk",
        json={"tenant_public_id": t_pid, "total_amount": "15000.00", "paid_on": "2024-02-01"},
        headers=_auth(auth_token),
    )
    assert resp.status_code == 201
    result = resp.json()["data"]
    assert result["dues_cleared"] == 1
    assert result["dues_partially_paid"] == 1
    assert result["total_applied"] == "15000.00"
    assert result["unapplied"] == "0.00"


async def test_bulk_payment_excess_returns_unapplied(
    client: AsyncClient, auth_token: str, test_tenant: dict
):
    """Amount exceeding total outstanding balance is returned as unapplied."""
    t_pid = test_tenant["public_id"]
    await _generate_due(client, auth_token, t_pid, 1, 2024)  # 10 000

    resp = await client.post(
        f"{BASE}/payments/bulk",
        json={"tenant_public_id": t_pid, "total_amount": "12000.00", "paid_on": "2024-01-15"},
        headers=_auth(auth_token),
    )
    assert resp.status_code == 201
    result = resp.json()["data"]
    assert result["dues_cleared"] == 1
    assert result["unapplied"] == "2000.00"


async def test_bulk_payment_no_dues(client: AsyncClient, auth_token: str, test_tenant: dict):
    """Bulk payment with no open dues returns 400."""
    # test_tenant has no dues generated in this test
    resp = await client.post(
        f"{BASE}/payments/bulk",
        json={
            "tenant_public_id": test_tenant["public_id"],
            "total_amount": "5000.00",
            "paid_on": "2024-01-15",
        },
        headers=_auth(auth_token),
    )
    assert resp.status_code == 400


async def test_bulk_payment_wrong_owner(
    client: AsyncClient, auth_token: str, test_tenant: dict, test_due: dict
):
    """A second owner cannot make a bulk payment for a tenant they do not own."""
    resp2 = await client.post(
        f"{BASE}/auth/register",
        json={"full_name": "Owner 2", "email": "owner2bulk@example.com", "password": "password123"},
    )
    token2 = resp2.json()["data"]["access_token"]
    resp = await client.post(
        f"{BASE}/payments/bulk",
        json={
            "tenant_public_id": test_tenant["public_id"],
            "total_amount": "5000.00",
            "paid_on": "2024-01-15",
        },
        headers=_auth(token2),
    )
    assert resp.status_code == 404


# ── list payments ─────────────────────────────────────────────────────────────


async def test_list_payments_success(client: AsyncClient, auth_token: str, test_due: dict):
    """Listing payments returns all records for the due, newest paid_on first."""
    due_pid = test_due["public_id"]
    await client.post(
        _payments_url(due_pid),
        json={"amount": "3000.00", "paid_on": "2024-01-10"},
        headers=_auth(auth_token),
    )
    await client.post(
        _payments_url(due_pid),
        json={"amount": "2000.00", "paid_on": "2024-01-20", "note": "second payment"},
        headers=_auth(auth_token),
    )

    resp = await client.get(_payments_url(due_pid), headers=_auth(auth_token))
    assert resp.status_code == 200
    body = resp.json()
    assert body["pagination"]["total"] == 2
    amounts = [p["amount_paid"] for p in body["data"]]
    assert "3000.00" in amounts
    assert "2000.00" in amounts
    # Newest paid_on first
    assert body["data"][0]["paid_on"] == "2024-01-20"


# ── refund ────────────────────────────────────────────────────────────────────


async def test_refund_payment_full_reverts_to_unpaid(
    client: AsyncClient, auth_token: str, test_due: dict
):
    """Refunding the only payment on a due reverts it to unpaid with full balance."""
    due_pid = test_due["public_id"]
    pay_resp = await client.post(
        _payments_url(due_pid),
        json={"amount": "10000.00", "paid_on": "2024-01-15"},
        headers=_auth(auth_token),
    )
    assert pay_resp.status_code == 201
    payment_pid = pay_resp.json()["data"]["payment"]["public_id"]

    refund_resp = await client.delete(
        f"{BASE}/payments/{payment_pid}",
        headers=_auth(auth_token),
    )
    assert refund_resp.status_code == 200
    result = refund_resp.json()["data"]
    assert result["new_status"] == "unpaid"
    assert result["new_amount_paid"] == "0.00"
    assert result["new_remaining_balance"] == "10000.00"


async def test_refund_payment_partial_stays_partial(
    client: AsyncClient, auth_token: str, test_due: dict
):
    """Refunding one of two partial payments leaves due in 'partial' status."""
    due_pid = test_due["public_id"]
    r1 = await client.post(
        _payments_url(due_pid),
        json={"amount": "4000.00", "paid_on": "2024-01-10"},
        headers=_auth(auth_token),
    )
    r2 = await client.post(
        _payments_url(due_pid),
        json={"amount": "3000.00", "paid_on": "2024-01-15"},
        headers=_auth(auth_token),
    )
    assert r1.status_code == 201
    assert r2.status_code == 201

    payment_pid = r1.json()["data"]["payment"]["public_id"]
    refund_resp = await client.delete(
        f"{BASE}/payments/{payment_pid}",
        headers=_auth(auth_token),
    )
    assert refund_resp.status_code == 200
    result = refund_resp.json()["data"]
    assert result["new_status"] == "partial"
    assert result["new_amount_paid"] == "3000.00"
    assert result["new_remaining_balance"] == "7000.00"


async def test_refund_payment_already_refunded_returns_404(
    client: AsyncClient, auth_token: str, test_due: dict
):
    """Attempting to refund an already-refunded payment returns 404."""
    due_pid = test_due["public_id"]
    pay_resp = await client.post(
        _payments_url(due_pid),
        json={"amount": "5000.00", "paid_on": "2024-01-15"},
        headers=_auth(auth_token),
    )
    payment_pid = pay_resp.json()["data"]["payment"]["public_id"]

    await client.delete(f"{BASE}/payments/{payment_pid}", headers=_auth(auth_token))
    resp = await client.delete(f"{BASE}/payments/{payment_pid}", headers=_auth(auth_token))
    assert resp.status_code == 404


async def test_refund_payment_wrong_owner_returns_404(
    client: AsyncClient, auth_token: str, test_due: dict
):
    """A second owner cannot refund a payment they do not own."""
    due_pid = test_due["public_id"]
    pay_resp = await client.post(
        _payments_url(due_pid),
        json={"amount": "5000.00", "paid_on": "2024-01-15"},
        headers=_auth(auth_token),
    )
    payment_pid = pay_resp.json()["data"]["payment"]["public_id"]

    resp2 = await client.post(
        f"{BASE}/auth/register",
        json={"full_name": "Owner 2", "email": "owner2refund@example.com", "password": "pass1234"},
    )
    token2 = resp2.json()["data"]["access_token"]
    resp = await client.delete(f"{BASE}/payments/{payment_pid}", headers=_auth(token2))
    assert resp.status_code == 404


# ── bulk payment history ───────────────────────────────────────────────────────


async def test_bulk_payment_history_empty(client: AsyncClient, auth_token: str):
    """Owner with no bulk payments gets an empty list."""
    resp = await client.get(f"{BASE}/payments/bulk-history", headers=_auth(auth_token))
    assert resp.status_code == 200
    assert resp.json()["data"] == []
    assert resp.json()["pagination"]["total"] == 0


async def test_bulk_payment_history_shows_transactions(
    client: AsyncClient, auth_token: str, test_tenant: dict
):
    """After a bulk payment, the history shows the transaction with all affected dues."""
    t_pid = test_tenant["public_id"]
    for month in [1, 2, 3]:
        await _generate_due(client, auth_token, t_pid, month, 2024)

    await client.post(
        f"{BASE}/payments/bulk",
        json={
            "tenant_public_id": t_pid,
            "total_amount": "20000.00",
            "paid_on": "2024-03-01",
            "note": "3-month advance",
        },
        headers=_auth(auth_token),
    )

    resp = await client.get(
        f"{BASE}/payments/bulk-history?page=1&page_size=10", headers=_auth(auth_token)
    )
    assert resp.status_code == 200
    items = resp.json()["data"]
    assert len(items) == 1
    tx = items[0]
    assert tx["tenant_name"] is not None
    assert tx["total_amount"] == "20000.00"
    assert tx["note"] == "3-month advance"
    assert len(tx["dues"]) == 2  # cleared 2 dues (month 1 and 2)
    due_months = {d["month"] for d in tx["dues"]}
    assert due_months == {1, 2}


async def test_bulk_payment_history_excludes_single_payments(
    client: AsyncClient, auth_token: str, test_due: dict
):
    """Single payments (is_bulk=False) do not appear in bulk payment history."""
    due_pid = test_due["public_id"]
    await client.post(
        f"{BASE}/dues/{due_pid}/payments",
        json={"amount": "10000.00", "paid_on": "2024-01-15"},
        headers=_auth(auth_token),
    )

    resp = await client.get(f"{BASE}/payments/bulk-history", headers=_auth(auth_token))
    assert resp.status_code == 200
    # Single payment should not appear in bulk history
    items = resp.json()["data"]
    assert all(not any(d["due_public_id"] == due_pid for d in tx["dues"]) for tx in items)
