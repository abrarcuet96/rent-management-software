import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { server, resetCounters } from "../mocks/server";
import Sidebar from "@/components/layout/Sidebar";
import { useAuthStore } from "@/stores/authStore";

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/dashboard"]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Navigation Integration", () => {
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

  it("renders all nav labels (both mobile and desktop)", () => {
    renderWithProviders(<Sidebar />);

    expect(screen.getAllByText("ড্যাশবোর্ড").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("বিল্ডিং").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("ভাড়াটেদের তালিকা").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("পেমেন্ট").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("খরচ").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("রিপোর্ট").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("সেটিংস").length).toBeGreaterThanOrEqual(1);
  });

  it("renders the app brand name", () => {
    renderWithProviders(<Sidebar />);
    expect(screen.getAllByText("RentFlow").length).toBeGreaterThanOrEqual(1);
  });

  it("renders owner initials in avatar", () => {
    renderWithProviders(<Sidebar />);
    expect(screen.getAllByText("T").length).toBeGreaterThanOrEqual(1);
  });

  it("renders theme toggle", () => {
    renderWithProviders(<Sidebar />);
    expect(screen.getAllByText("থিম").length).toBeGreaterThanOrEqual(1);
  });

  it("has correct nav link paths", () => {
    renderWithProviders(<Sidebar />);

    expect(screen.getAllByText("ড্যাশবোর্ড")[0].closest("a")).toHaveAttribute("href", "/dashboard");
    expect(screen.getAllByText("বিল্ডিং")[0].closest("a")).toHaveAttribute("href", "/buildings");
    expect(screen.getAllByText("ভাড়াটেদের তালিকা")[0].closest("a")).toHaveAttribute("href", "/tenants");
    expect(screen.getAllByText("পেমেন্ট")[0].closest("a")).toHaveAttribute("href", "/payments");
    expect(screen.getAllByText("খরচ")[0].closest("a")).toHaveAttribute("href", "/expenses");
    expect(screen.getAllByText("রিপোর্ট")[0].closest("a")).toHaveAttribute("href", "/reports");
    expect(screen.getAllByText("সেটিংস")[0].closest("a")).toHaveAttribute("href", "/settings");
  });

  it("does not render owner avatar when not authenticated", () => {
    useAuthStore.getState().logout();
    renderWithProviders(<Sidebar />);
    expect(screen.queryByText("T")).not.toBeInTheDocument();
  });
});