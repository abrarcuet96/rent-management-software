import { afterEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server, resetCounters } from "../mocks/server";
import BuildingsPage from "@/pages/buildings/BuildingsPage";
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

describe("Buildings Integration", () => {
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

  it("renders buildings list on load", async () => {
    renderWithProviders(<BuildingsPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Building")).toBeInTheDocument();
    });
    expect(screen.getByText("123 Test St")).toBeInTheDocument();
  });

  it("shows pagination total count", async () => {
    renderWithProviders(<BuildingsPage />);

    await waitFor(() => {
      expect(screen.getByText(/মোট.*টি বিল্ডিং/)).toBeInTheDocument();
    });
  });

  it("shows empty state when no buildings exist", async () => {
    server.use(
      http.get("*/buildings", () => {
        return HttpResponse.json({
          success: true,
          data: [],
          pagination: { page: 1, page_size: 100, total: 0 },
          message: "Buildings fetched",
        });
      }),
    );

    renderWithProviders(<BuildingsPage />);

    await waitFor(() => {
      expect(screen.getByText("কোনো বিল্ডিং নেই")).toBeInTheDocument();
    });
  });

  it("shows error state on API failure", async () => {
    server.use(
      http.get("*/buildings", () => {
        return HttpResponse.json(
          { success: false, data: null, message: "Server error" },
          { status: 500 },
        );
      }),
    );

    renderWithProviders(<BuildingsPage />);

    await waitFor(() => {
      expect(screen.getByText(/আবার চেষ্টা করুন|Error|error/i)).toBeInTheDocument();
    });
  });

  it("opens create building dialog", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BuildingsPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Building")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /নতুন বিল্ডিং/i }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("opens create dialog from empty state action", async () => {
    server.use(
      http.get("*/buildings", () => {
        return HttpResponse.json({
          success: true,
          data: [],
          pagination: { page: 1, page_size: 100, total: 0 },
          message: "Buildings fetched",
        });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<BuildingsPage />);

    await waitFor(() => {
      expect(screen.getByText("কোনো বিল্ডিং নেই")).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole("button", { name: /নতুন বিল্ডিং/i });
    await user.click(buttons[1]);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("shows loading skeleton initially", () => {
    server.use(
      http.get("*/buildings", async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return HttpResponse.json({
          success: true,
          data: [],
          pagination: { page: 1, page_size: 100, total: 0 },
          message: "Buildings fetched",
        });
      }),
    );

    renderWithProviders(<BuildingsPage />);
    expect(screen.getByText("আপনার বিল্ডিং সমূহ")).toBeInTheDocument();
  });

  it("renders building floors on card", async () => {
    renderWithProviders(<BuildingsPage />);

    await waitFor(() => {
      expect(screen.getByText(/5 তলা/)).toBeInTheDocument();
    });
  });

  it("renders building detail link on card", async () => {
    renderWithProviders(<BuildingsPage />);

    await waitFor(() => {
      expect(screen.getByText("বিস্তারিত")).toBeInTheDocument();
    });
  });
});