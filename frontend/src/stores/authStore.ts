import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface AUTH_USER {
  public_id: string;
  full_name: string;
  email: string;
}

interface AUTH_STATE {
  token: string | null;
  user: AUTH_USER | null;
  setAuth: (token: string, user: AUTH_USER) => void;
  logout: () => void;
}

export const useAuthStore = create<AUTH_STATE>()(
  devtools(
    persist(
      (set) => ({
        token: null,
        user: null,
        setAuth: (token, user) => set({ token, user }),
        logout: () => set({ token: null, user: null }),
      }),
      {
        name: "rentflow-auth",
      },
    ),
    { name: "authStore" },
  ),
);
