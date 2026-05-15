import type { Apartment, PaginatedResponse, StandardResponse } from "@/types";
import apiClient from "./client";

export const getApartments = (buildingId: string, params?: Record<string, unknown>) =>
  apiClient.get<PaginatedResponse<Apartment>>(`/buildings/${buildingId}/apartments`, { params });

export const getApartmentById = (buildingId: string, aptId: string) =>
  apiClient.get<StandardResponse<Apartment>>(`/buildings/${buildingId}/apartments/${aptId}`);

export const createApartment = (
  buildingId: string,
  data: { unit_number: string; floor: number; status?: string },
) => apiClient.post<StandardResponse<Apartment>>(`/buildings/${buildingId}/apartments`, data);

export const updateApartment = (
  buildingId: string,
  aptId: string,
  data: { unit_number?: string; floor?: number; status?: string },
) =>
  apiClient.put<StandardResponse<Apartment>>(
    `/buildings/${buildingId}/apartments/${aptId}`,
    data,
  );

export const deleteApartment = (buildingId: string, aptId: string) =>
  apiClient.delete<StandardResponse<null>>(`/buildings/${buildingId}/apartments/${aptId}`);
