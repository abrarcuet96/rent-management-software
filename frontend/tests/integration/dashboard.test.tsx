import { afterEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server, resetCounters } from "../mocks/server";
import DashboardPage from "@/pages/DashboardPage";
import { useAuthStore } from "@/stores/authStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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

describe("Dashboard Integration", () => {
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

  it("renders dashboard stat card titles", async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("এই মাসে সংগৃহীত")).toBeInTheDocument();
    });
    expect(screen.getByText("মোট বাকি")).toBeInTheDocument();
    expect(screen.getByText("খালি অ্যাপার্টমেন্ট")).toBeInTheDocument();
    expect(screen.getByText("ভাড়াটে সংখ্যা")).toBeInTheDocument();
  });

  it("renders currency values from API", async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/১৫,০০০/)).toBeInTheDocument();
    });
    expect(screen.getByText(/১০,০০০/)).toBeInTheDocument();
  });

  it("renders vacant apartments count from API", async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });
  });

  it("renders occupied apartments count from API", async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });

  it("shows no overdue message when list is empty", async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("কোনো বকেয়া নেই")).toBeInTheDocument();
    });
  });

  it("renders month and year selectors", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText(/জানুয়ারি/)).toBeInTheDocument();
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });
});