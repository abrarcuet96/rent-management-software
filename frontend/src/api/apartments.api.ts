import type { APARTMENT, PAGINATED_RESPONSE, STANDARD_RESPONSE } from "@/types";
import apiClient from "./client";

export const getApartments = (buildingId: string, params?: Record<string, unknown>) =>
  apiClient.get<PAGINATED_RESPONSE<APARTMENT>>(`/buildings/${buildingId}/apartments`, { params });

export const getApartmentById = (buildingId: string, aptId: string) =>
  apiClient.get<STANDARD_RESPONSE<APARTMENT>>(`/buildings/${buildingId}/apartments/${aptId}`);

export const createApartment = (
  buildingId: string,
  data: { unit_number: string; floor: number; status?: string },
) => apiClient.post<STANDARD_RESPONSE<APARTMENT>>(`/buildings/${buildingId}/apartments`, data);

export const updateApartment = (
  buildingId: string,
  aptId: string,
  data: { unit_number?: string; floor?: number; status?: string },
) =>
  apiClient.put<STANDARD_RESPONSE<APARTMENT>>(
    `/buildings/${buildingId}/apartments/${aptId}`,
    data,
  );

export const deleteApartment = (buildingId: string, aptId: string) =>
  apiClient.delete<STANDARD_RESPONSE<null>>(`/buildings/${buildingId}/apartments/${aptId}`);
