import { afterEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server, resetCounters } from "../mocks/server";
import ExpensesPage from "@/pages/ExpensesPage";
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

describe("Expenses Integration", () => {
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

  describe("ExpensesTab", () => {
    it("renders expenses table with data", async () => {
      renderWithProviders(<ExpensesPage />);

      await waitFor(() => {
        expect(screen.getByText("Plumbing repair")).toBeInTheDocument();
      });
    });

    it("renders expense total count heading", async () => {
      renderWithProviders(<ExpensesPage />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
      });
    });

    it("shows create expense button", async () => {
      renderWithProviders(<ExpensesPage />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /নতুন খরচ/i })).toBeInTheDocument();
      });
    });

    it("shows empty state when no expenses exist", async () => {
      server.use(
        http.get("*/expenses", () => {
          return HttpResponse.json({
            success: true,
            data: [],
            pagination: { page: 1, page_size: 100, total: 0 },
            message: "Expenses fetched",
          });
        }),
      );

      renderWithProviders(<ExpensesPage />);

      await waitFor(() => {
        expect(screen.getByText("কোনো খরচ নেই")).toBeInTheDocument();
      });
    });

    it("renders expense type badge for building-level expenses", async () => {
      renderWithProviders(<ExpensesPage />);

      await waitFor(() => {
        expect(screen.getByText("বিল্ডিং")).toBeInTheDocument();
      });
    });
  });

  describe("ExpenseCategoriesTab", () => {
    it("switches to categories tab and shows categories", async () => {
      const user = userEvent.setup();
      renderWithProviders(<ExpensesPage />);

      await user.click(screen.getByRole("tab", { name: /ক্যাটাগরি/i }));

      await waitFor(() => {
        expect(screen.getByText("Maintenance")).toBeInTheDocument();
      });
      expect(screen.getByText("Utilities")).toBeInTheDocument();
    });

    it("shows default badge for default categories", async () => {
      const user = userEvent.setup();
      renderWithProviders(<ExpensesPage />);

      await user.click(screen.getByRole("tab", { name: /ক্যাটাগরি/i }));

      await waitFor(() => {
        expect(screen.getByText("Maintenance")).toBeInTheDocument();
      });

      const defaultBadges = screen.getAllByText("ডিফল্ট");
      expect(defaultBadges.length).toBeGreaterThanOrEqual(1);
    });

    it("shows create category button on categories tab", async () => {
      const user = userEvent.setup();
      renderWithProviders(<ExpensesPage />);

      await user.click(screen.getByRole("tab", { name: /ক্যাটাগরি/i }));

      await waitFor(() => {
        expect(screen.getByText("Maintenance")).toBeInTheDocument();
      });

      expect(screen.getByRole("button", { name: /নতুন ক্যাটাগরি/i })).toBeInTheDocument();
    });

    it("shows delete button only for non-default categories", async () => {
      const user = userEvent.setup();
      renderWithProviders(<ExpensesPage />);

      await user.click(screen.getByRole("tab", { name: /ক্যাটাগরি/i }));

      await waitFor(() => {
        expect(screen.getByText("Maintenance")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole("button", { name: /ডিলিট/i });
      expect(deleteButtons.length).toBe(1);
    });
  });
});