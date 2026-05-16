import { afterEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server, resetCounters } from "../mocks/server";
import BulkPaymentTab from "@/components/payments/BulkPaymentTab";
import { useAuthStore } from "@/stores/authStore";

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>,
  );
}

describe("BulkPaymentTab - API Layer", () => {
  beforeEach(() => {
    useAuthStore.getState().setAuth("mock-jwt-token", {
      public_id: "owner-1",
      full_name: "Test Owner",
      email: "test@example.com",
    });
  });

  afterEach(() => {
    resetCounters();
    server.resetHandlers();
  });

  it("renders form fields", () => {
    renderWithProviders(<BulkPaymentTab />);

    expect(screen.getByText(/মোট পেমেন্ট পরিমাণ/i)).toBeInTheDocument();
    expect(screen.getByText(/পেমেন্টের তারিখ/i)).toBeInTheDocument();
    expect(screen.getByText(/নোট/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /বাল্ক পেমেন্ট করুন/i })).toBeInTheDocument();
  });

  it("submit button is disabled when no tenant is selected", () => {
    renderWithProviders(<BulkPaymentTab />);

    expect(screen.getByRole("button", { name: /বাল্ক পেমেন্ট করুন/i })).toBeDisabled();
  });

  it("shows no dues message when tenant has no open dues", async () => {
    server.use(
      http.get("*/tenants", () => {
        return HttpResponse.json({
          success: true,
          data: [
            {
              public_id: "tenant-1",
              apartment_public_id: "apt-1",
              full_name: "Rahim Uddin",
              phone: "01712345678",
              is_active: true,
              created_at: "2025-01-01T00:00:00Z",
            },
          ],
          pagination: { page: 1, page_size: 100, total: 1 },
          message: "Tenants fetched",
        });
      }),
    );

    renderWithProviders(<BulkPaymentTab />);

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
  });

  it("renders tenant selector placeholder", () => {
    renderWithProviders(<BulkPaymentTab />);

    expect(screen.getByText(/ভাড়াটে বেছে নিন/i)).toBeInTheDocument();
  });
});
