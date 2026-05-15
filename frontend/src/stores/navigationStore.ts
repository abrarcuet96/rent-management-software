import { create } from "zustand";

interface NavigationState {
  activeBuildingId: string | null;
  activeBuildingName: string | null;
  activeApartmentId: string | null;
  activeApartmentName: string | null;
  activeTenantId: string | null;
  activeTenantName: string | null;
  setActiveBuilding: (id: string | null, name?: string | null) => void;
  setActiveApartment: (id: string | null, name?: string | null) => void;
  setActiveTenant: (id: string | null, name?: string | null) => void;
}

export const useNavigationStore = create<NavigationState>()((set) => ({
  activeBuildingId: null,
  activeBuildingName: null,
  activeApartmentId: null,
  activeApartmentName: null,
  activeTenantId: null,
  activeTenantName: null,
  setActiveBuilding: (id, name = null) =>
    set({ activeBuildingId: id, activeBuildingName: name }),
  setActiveApartment: (id, name = null) =>
    set({ activeApartmentId: id, activeApartmentName: name }),
  setActiveTenant: (id, name = null) =>
    set({ activeTenantId: id, activeTenantName: name }),
}));
