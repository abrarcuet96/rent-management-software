import { afterEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server, resetCounters } from "../mocks/server";
import TenantsPage from "@/pages/tenants/TenantsPage";
import { useAuthStore } from "@/stores/authStore";

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Tenants Integration", () => {
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
    useAuthStore.getState().logout();
  });

  it("renders tenants list on load", async () => {
    renderWithProviders(<TenantsPage />);

    await waitFor(() => {
      expect(screen.getByText("Rahim Uddin")).toBeInTheDocument();
    });
  });

  it("renders page heading", () => {
    renderWithProviders(<TenantsPage />);
    expect(screen.getByText("ভাড়াটেদের তালিকা")).toBeInTheDocument();
  });

  it("renders tab triggers", () => {
    renderWithProviders(<TenantsPage />);
    expect(screen.getByRole("tab", { name: /সক্রিয়/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /চলে গেছে/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /সব/i })).toBeInTheDocument();
  });

  it("defaults to active tab", async () => {
    renderWithProviders(<TenantsPage />);

    await waitFor(() => {
      expect(screen.getByText("Rahim Uddin")).toBeInTheDocument();
    });
  });

  it("shows tenant phone number on card", async () => {
    renderWithProviders(<TenantsPage />);

    await waitFor(() => {
      expect(screen.getByText("01712345678")).toBeInTheDocument();
    });
  });

  it("shows empty state when no tenants exist", async () => {
    server.use(
      http.get("*/tenants", () => {
        return HttpResponse.json({
          success: true,
          data: [],
          pagination: { page: 1, page_size: 100, total: 0 },
          message: "Tenants fetched",
        });
      }),
    );

    renderWithProviders(<TenantsPage />);

    await waitFor(() => {
      expect(screen.getByText("কোনো ভাড়াটে নেই")).toBeInTheDocument();
    });
  });

  it("shows error state on API failure", async () => {
    server.use(
      http.get("*/tenants", () => {
        return HttpResponse.json(
          { success: false, data: null, message: "Server error" },
          { status: 500 },
        );
      }),
    );

    renderWithProviders(<TenantsPage />);

    await waitFor(() => {
      expect(screen.getByText(/আবার চেষ্টা করুন|Error|error/i)).toBeInTheDocument();
    });
  });

  it("renders tenant detail link", async () => {
    renderWithProviders(<TenantsPage />);

    await waitFor(() => {
      expect(screen.getByText("বিস্তারিত")).toBeInTheDocument();
    });
  });
});
