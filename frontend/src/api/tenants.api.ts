import type { PaginatedResponse, StandardResponse, Tenant } from "@/types";
import apiClient from "./client";

export const getTenants = (params?: Record<string, unknown>) =>
  apiClient.get<PaginatedResponse<Tenant>>("/tenants", { params });

export const getTenantById = (id: string) =>
  apiClient.get<StandardResponse<Tenant>>(`/tenants/${id}`);

export const getActiveTenant = (apartmentId: string) =>
  apiClient.get<StandardResponse<Tenant>>(`/apartments/${apartmentId}/tenants/active`);

export const addTenant = (apartmentId: string, data: Record<string, unknown>) =>
  apiClient.post<StandardResponse<Tenant>>(`/apartments/${apartmentId}/tenants`, data);

export const updateTenant = (
  apartmentId: string,
  tenantId: string,
  data: Record<string, unknown>,
) =>
  apiClient.put<StandardResponse<Tenant>>(
    `/apartments/${apartmentId}/tenants/${tenantId}`,
    data,
  );

export const markMovedOut = (
  apartmentId: string,
  tenantId: string,
  data: { move_out_date: string },
) =>
  apiClient.delete<StandardResponse<Tenant>>(
    `/apartments/${apartmentId}/tenants/${tenantId}`,
    { data },
  );
