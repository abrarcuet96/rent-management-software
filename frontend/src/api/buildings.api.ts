import type { BUILDING, PAGINATED_RESPONSE, STANDARD_RESPONSE } from "@/types";
import apiClient from "./client";

export const getBuildings = (params?: Record<string, unknown>) =>
  apiClient.get<PAGINATED_RESPONSE<BUILDING>>("/buildings", { params });

export const getBuildingById = (id: string) =>
  apiClient.get<STANDARD_RESPONSE<BUILDING>>(`/buildings/${id}`);

export const createBuilding = (data: { name: string; address: string; total_floors: number }) =>
  apiClient.post<STANDARD_RESPONSE<BUILDING>>("/buildings", data);

export const updateBuilding = (
  id: string,
  data: { name?: string; address?: string; total_floors?: number },
) => apiClient.put<STANDARD_RESPONSE<BUILDING>>(`/buildings/${id}`, data);

export const deleteBuilding = (id: string) =>
  apiClient.delete<STANDARD_RESPONSE<null>>(`/buildings/${id}`);
