import type { Building, PaginatedResponse, StandardResponse } from "@/types";
import apiClient from "./client";

export const getBuildings = (params?: Record<string, unknown>) =>
  apiClient.get<PaginatedResponse<Building>>("/buildings", { params });

export const getBuildingById = (id: string) =>
  apiClient.get<StandardResponse<Building>>(`/buildings/${id}`);

export const createBuilding = (data: { name: string; address: string; total_floors: number }) =>
  apiClient.post<StandardResponse<Building>>("/buildings", data);

export const updateBuilding = (
  id: string,
  data: { name?: string; address?: string; total_floors?: number },
) => apiClient.put<StandardResponse<Building>>(`/buildings/${id}`, data);

export const deleteBuilding = (id: string) =>
  apiClient.delete<StandardResponse<null>>(`/buildings/${id}`);
