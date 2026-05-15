import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";
type BuildingStatusFilter = "all" | "vacant" | "occupied";
type TenantStatusFilter = "active" | "moved_out" | "all";

interface UiState {
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  theme: Theme;
  buildingStatusFilter: BuildingStatusFilter;
  tenantStatusFilter: TenantStatusFilter;
  toggleSidebar: () => void;
  setTheme: (theme: Theme) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  setBuildingStatusFilter: (filter: BuildingStatusFilter) => void;
  setTenantStatusFilter: (filter: TenantStatusFilter) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileMenuOpen: false,
      theme: "system",
      buildingStatusFilter: "all",
      tenantStatusFilter: "active",
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setTheme: (theme) => set({ theme }),
      toggleMobileMenu: () => set((s) => ({ mobileMenuOpen: !s.mobileMenuOpen })),
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
      setBuildingStatusFilter: (filter) => set({ buildingStatusFilter: filter }),
      setTenantStatusFilter: (filter) => set({ tenantStatusFilter: filter }),
    }),
    {
      name: "rentflow-ui",
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed, theme: state.theme }),
    },
  ),
);
