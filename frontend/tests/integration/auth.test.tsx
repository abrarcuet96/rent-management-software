import { afterEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server, resetCounters } from "../mocks/server";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
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

describe("Auth Integration", () => {
  afterEach(() => {
    resetCounters();
    useAuthStore.getState().logout();
  });

  describe("Login", () => {
    it("logs in successfully and stores token", async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginPage />);

      await user.type(screen.getByLabelText(/ইমেইল/i), "test@example.com");
      await user.type(screen.getByLabelText(/পাসওয়ার্ড/i), "123456");
      await user.click(screen.getByRole("button", { name: /লগইন/i }));

      await waitFor(() => {
        const state = useAuthStore.getState();
        expect(state.token).toBe("mock-jwt-token");
      });
    });

    it("shows validation error for short password", async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginPage />);

      await user.type(screen.getByLabelText(/ইমেইল/i), "test@example.com");
      await user.type(screen.getByLabelText(/পাসওয়ার্ড/i), "12345");
      await user.click(screen.getByRole("button", { name: /লগইন/i }));

      await waitFor(() => {
        expect(screen.getByText(/কমপক্ষে ৬/i)).toBeInTheDocument();
      });
    });

    it("shows server error on 401", async () => {
      server.use(
        http.post("*/auth/login", () => {
          return HttpResponse.json(
            { success: false, data: null, message: "Invalid credentials" },
            { status: 401 },
          );
        }),
      );

      const user = userEvent.setup();
      renderWithProviders(<LoginPage />);

      await user.type(screen.getByLabelText(/ইমেইল/i), "bad@example.com");
      await user.type(screen.getByLabelText(/পাসওয়ার্ড/i), "12345678");
      await user.click(screen.getByRole("button", { name: /লগইন/i }));

      await waitFor(() => {
        expect(screen.getByText(/Invalid credentials|সঠিক নয়/i)).toBeInTheDocument();
      });
    });
  });

  describe("Register", () => {
    it("renders register form correctly", () => {
      renderWithProviders(<RegisterPage />);

      expect(screen.getByRole("button", { name: /নিবন্ধন করুন/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/পূর্ণ নাম/i)).toBeInTheDocument();
    });

    it("shows validation error for short name", async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterPage />);

      await user.type(screen.getByLabelText(/পূর্ণ নাম/i), "A");
      await user.tab();
      await user.click(screen.getByRole("button", { name: /নিবন্ধন করুন/i }));

      await waitFor(() => {
        expect(screen.getByText(/কমপক্ষে ২/i)).toBeInTheDocument();
      });
    });
  });
});
