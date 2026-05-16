import { http, HttpResponse } from "msw";

const API_BASE = "http://localhost:8000/api/v1";

let buildingCounter = 1;
let apartmentCounter = 1;
let tenantCounter = 1;
let agreementCounter = 1;
let dueCounter = 1;
let expenseCategoryCounter = 1;
let expenseCounter = 1;

function resetCounters() {
  buildingCounter = 1;
  apartmentCounter = 1;
  tenantCounter = 1;
  agreementCounter = 1;
  dueCounter = 1;
  expenseCategoryCounter = 1;
  expenseCounter = 1;
}

export const handlers = [
  // ── Auth ────────────────────────────────────────────────────
  http.post(`${API_BASE}/auth/login`, async () => {
    return HttpResponse.json(
      {
        success: true,
        data: {
          public_id: "owner-1",
          full_name: "Test Owner",
          email: "test@example.com",
          access_token: "mock-jwt-token",
          token_type: "bearer",
        },
        message: "Login successful",
      },
      { status: 200 },
    );
  }),

  http.post(`${API_BASE}/auth/register`, async () => {
    return HttpResponse.json(
      {
        success: true,
        data: {
          public_id: "owner-new",
          full_name: "New Owner",
          email: "new@example.com",
        },
        message: "Registration successful",
      },
      { status: 201 },
    );
  }),

  // ── Buildings ────────────────────────────────────────────────
  http.get(`${API_BASE}/buildings`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          public_id: "bld-1",
          name: "Test Building",
          address: "123 Test St",
          total_floors: 5,
          is_active: true,
          created_at: "2025-01-01T00:00:00Z",
        },
      ],
      pagination: { page: 1, page_size: 20, total: 1 },
      message: "Buildings fetched",
    });
  }),

  http.post(`${API_BASE}/buildings`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const id = `bld-${buildingCounter++}`;
    return HttpResponse.json(
      {
        success: true,
        data: {
          public_id: id,
          name: body.name,
          address: body.address,
          total_floors: body.total_floors,
          is_active: true,
          created_at: "2025-01-01T00:00:00Z",
        },
        message: "Building created",
      },
      { status: 201 },
    );
  }),

  // ── Apartments ──────────────────────────────────────────────
  http.get(`${API_BASE}/buildings/:buildingId/apartments`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          public_id: "apt-1",
          building_public_id: "bld-1",
          unit_number: "A-101",
          floor: 1,
          status: "vacant",
          is_active: true,
          created_at: "2025-01-01T00:00:00Z",
        },
      ],
      pagination: { page: 1, page_size: 20, total: 1 },
      message: "Apartments fetched",
    });
  }),

  http.post(`${API_BASE}/buildings/:buildingId/apartments`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const id = `apt-${apartmentCounter++}`;
    return HttpResponse.json(
      {
        success: true,
        data: {
          public_id: id,
          building_public_id: "bld-1",
          unit_number: body.unit_number,
          floor: body.floor,
          status: "vacant",
          is_active: true,
          created_at: "2025-01-01T00:00:00Z",
        },
        message: "Apartment created",
      },
      { status: 201 },
    );
  }),

  // ── Tenants ─────────────────────────────────────────────────
  http.get(`${API_BASE}/tenants`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const tenants = [
      {
        public_id: "tenant-1",
        apartment_public_id: "apt-1",
        full_name: "Rahim Uddin",
        phone: "01712345678",
        nid_number: "1234567890",
        address: "Dhaka",
        member_count: 3,
        move_in_date: "2025-01-01",
        move_out_date: null,
        is_active: status === "active" ? true : true,
        created_at: "2025-01-01T00:00:00Z",
      },
    ];
    return HttpResponse.json({
      success: true,
      data: tenants,
      pagination: { page: 1, page_size: 100, total: tenants.length },
      message: "Tenants fetched",
    });
  }),

  http.post(`${API_BASE}/apartments/:apartmentId/tenants`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const id = `tenant-${tenantCounter++}`;
    return HttpResponse.json(
      {
        success: true,
        data: {
          public_id: id,
          apartment_public_id: "apt-1",
          full_name: body.full_name,
          phone: body.phone,
          nid_number: body.nid_number ?? null,
          address: body.address ?? null,
          member_count: body.member_count,
          move_in_date: body.move_in_date,
          move_out_date: null,
          is_active: true,
          created_at: "2025-01-01T00:00:00Z",
        },
        message: "Tenant created",
      },
      { status: 201 },
    );
  }),

  // ── Agreements ─────────────────────────────────────────────
  http.get(`${API_BASE}/agreements`, ({ request }) => {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenant_public_id");
    return HttpResponse.json({
      success: true,
      data: [
        {
          public_id: "agree-1",
          tenant_public_id: tenantId ?? "tenant-1",
          rent_amount: 5000,
          start_date: "2025-01-01",
          end_date: null,
          is_active: true,
          created_at: "2025-01-01T00:00:00Z",
        },
      ],
      message: "Agreements fetched",
    });
  }),

  http.post(`${API_BASE}/agreements`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const id = `agree-${agreementCounter++}`;
    return HttpResponse.json(
      {
        success: true,
        data: {
          public_id: id,
          tenant_public_id: body.tenant_public_id ?? "tenant-1",
          rent_amount: body.rent_amount,
          start_date: body.start_date,
          end_date: null,
          is_active: true,
          created_at: "2025-01-01T00:00:00Z",
        },
        message: "Agreement created",
      },
      { status: 201 },
    );
  }),

  // ── Dues ────────────────────────────────────────────────────
  http.get(`${API_BASE}/dues/:tenantId`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          public_id: "due-1",
          tenant_public_id: "tenant-1",
          agreement_public_id: "agree-1",
          month: 1,
          year: 2025,
          rent_amount: 5000,
          total_due: 5000,
          amount_paid: 0,
          remaining_balance: 5000,
          status: "unpaid",
          is_auto_generated: true,
          due_date: "2025-01-05",
          created_at: "2025-01-01T00:00:00Z",
        },
        {
          public_id: "due-2",
          tenant_public_id: "tenant-1",
          agreement_public_id: "agree-1",
          month: 2,
          year: 2025,
          rent_amount: 5000,
          total_due: 5000,
          amount_paid: 2000,
          remaining_balance: 3000,
          status: "partial",
          is_auto_generated: true,
          due_date: "2025-02-05",
          created_at: "2025-02-01T00:00:00Z",
        },
      ],
      pagination: { page: 1, page_size: 100, total: 2 },
      message: "Dues fetched",
    });
  }),

  http.post(`${API_BASE}/dues/generate`, async () => {
    const id = `due-${dueCounter++}`;
    return HttpResponse.json(
      {
        success: true,
        data: {
          public_id: id,
          tenant_public_id: "tenant-1",
          agreement_public_id: "agree-1",
          month: 3,
          year: 2025,
          rent_amount: 5000,
          total_due: 5000,
          amount_paid: 0,
          remaining_balance: 5000,
          status: "unpaid",
          is_auto_generated: false,
          due_date: "2025-03-05",
          created_at: "2025-03-01T00:00:00Z",
        },
        message: "Due generated",
      },
      { status: 201 },
    );
  }),

  // ── Payments ────────────────────────────────────────────────
  http.post(`${API_BASE}/dues/:dueId/payments`, async () => {
    return HttpResponse.json(
      {
        success: true,
        data: {
          public_id: "pay-1",
          due_public_id: "due-1",
          amount_paid: 5000,
          paid_on: "2025-01-15",
          note: null,
          is_active: true,
          created_at: "2025-01-15T00:00:00Z",
        },
        message: "Payment recorded",
      },
      { status: 201 },
    );
  }),

  http.post(`${API_BASE}/payments/bulk`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        success: true,
        data: {
          total_applied: body.total_amount,
          unapplied: 0,
          dues_cleared: 1,
          dues_partially_paid: 0,
          dues_updated: [
            {
              due_public_id: "due-1",
              month: 1,
              year: 2025,
              applied_amount: 5000,
              new_status: "paid",
            },
          ],
          payment_records: [
            {
              public_id: "pay-1",
              due_public_id: "due-1",
              amount_paid: 5000,
              paid_on: body.paid_on,
              note: body.note ?? null,
              is_active: true,
              created_at: "2025-01-15T00:00:00Z",
            },
          ],
        },
        message: "Bulk payment applied",
      },
      { status: 201 },
    );
  }),

  // ── Expenses ────────────────────────────────────────────────
  http.get(`${API_BASE}/expense-categories`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        { public_id: "cat-1", name: "Maintenance", is_default: true },
        { public_id: "cat-2", name: "Utilities", is_default: false },
      ],
      pagination: { page: 1, page_size: 100, total: 2 },
      message: "Categories fetched",
    });
  }),

  http.post(`${API_BASE}/expense-categories`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const id = `cat-${expenseCategoryCounter++}`;
    return HttpResponse.json(
      {
        success: true,
        data: { public_id: id, name: body.name, is_default: false },
        message: "Category created",
      },
      { status: 201 },
    );
  }),

  http.get(`${API_BASE}/expenses`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          public_id: "exp-1",
          category_public_id: "cat-1",
          building_public_id: "bld-1",
          apartment_public_id: null,
          description: "Plumbing repair",
          amount: 5000,
          expense_date: "2025-01-10",
          is_tenant_charged: false,
        },
      ],
      pagination: { page: 1, page_size: 20, total: 1 },
      message: "Expenses fetched",
    });
  }),

  http.post(`${API_BASE}/expenses`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const id = `exp-${expenseCounter++}`;
    return HttpResponse.json(
      {
        success: true,
        data: {
          public_id: id,
          category_public_id: body.category_public_id,
          building_public_id: body.building_public_id ?? null,
          apartment_public_id: body.apartment_public_id ?? null,
          description: body.description,
          amount: body.amount,
          expense_date: body.expense_date,
          is_tenant_charged: body.is_tenant_charged ?? false,
        },
        message: "Expense created",
      },
      { status: 201 },
    );
  }),

  // ── Dashboard ───────────────────────────────────────────────
  http.get(`${API_BASE}/dashboard/summary`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        total_collected: 15000,
        total_outstanding: 10000,
        vacant_apartments: 2,
        occupied_apartments: 3,
        total_expenses: 5000,
        net_profit: 10000,
        month: 1,
        year: 2025,
      },
      message: "Dashboard data fetched",
    });
  }),

  // ── Reports ─────────────────────────────────────────────────
  http.get(`${API_BASE}/reports/overdue-list`, () => {
    return HttpResponse.json({
      success: true,
      data: [],
      message: "Overdue report fetched",
    });
  }),

  http.get(`${API_BASE}/reports/monthly-collection`, () => {
    return HttpResponse.json({
      success: true,
      data: [],
      message: "Monthly collection fetched",
    });
  }),

  http.get(`${API_BASE}/reports/annual-summary`, ({ request }) => {
    const url = new URL(request.url);
    const year = Number(url.searchParams.get("year")) || new Date().getFullYear();
    return HttpResponse.json({
      success: true,
      data: {
        year,
        total_collected: 120000,
        total_expenses: 20000,
        net_profit: 100000,
        total_outstanding: 15000,
      },
      message: "Annual summary fetched",
    });
  }),

  http.delete(`${API_BASE}/payments/:paymentId`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        refunded_payment: {
          public_id: "pay-1",
          due_public_id: "due-1",
          amount_paid: 5000,
          paid_on: "2025-01-15",
          note: null,
          is_active: false,
          created_at: "2025-01-15T00:00:00Z",
        },
        due_public_id: "due-1",
        new_status: "unpaid",
        new_amount_paid: "0.00",
        new_remaining_balance: "5000.00",
      },
      message: "Payment refunded",
    });
  }),
];

export { resetCounters };
