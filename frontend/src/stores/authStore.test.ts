import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "./authStore";

describe("authStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ token: null, user: null });
  });

  it("starts with null token and user", () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  it("setAuth stores token and user", () => {
    useAuthStore.getState().setAuth("jwt-token-123", {
      public_id: "user-1",
      full_name: "Test Owner",
      email: "test@example.com",
    });

    const state = useAuthStore.getState();
    expect(state.token).toBe("jwt-token-123");
    expect(state.user).toEqual({
      public_id: "user-1",
      full_name: "Test Owner",
      email: "test@example.com",
    });
  });

  it("logout clears token and user", () => {
    useAuthStore.getState().setAuth("jwt-token-123", {
      public_id: "user-1",
      full_name: "Test Owner",
      email: "test@example.com",
    });

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  it("persists auth state to localStorage", () => {
    useAuthStore.getState().setAuth("jwt-token-123", {
      public_id: "user-1",
      full_name: "Test Owner",
      email: "test@example.com",
    });

    const stored = localStorage.getItem("rentflow-auth");
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.state.token).toBe("jwt-token-123");
  });

  it("logout clears persisted state", () => {
    useAuthStore.getState().setAuth("jwt-token-123", {
      public_id: "user-1",
      full_name: "Test Owner",
      email: "test@example.com",
    });

    useAuthStore.getState().logout();

    const stored = localStorage.getItem("rentflow-auth");
    const parsed = JSON.parse(stored!);
    expect(parsed.state.token).toBeNull();
  });
});
