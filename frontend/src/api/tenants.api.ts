import type { PAGINATED_RESPONSE, STANDARD_RESPONSE, TENANT } from "@/types";
import apiClient from "./client";

export const getTenants = (params?: Record<string, unknown>) =>
  apiClient.get<PAGINATED_RESPONSE<TENANT>>("/tenants", { params });

export const getTenantById = (id: string) =>
  apiClient.get<STANDARD_RESPONSE<TENANT>>(`/tenants/${id}`);

export const getActiveTenant = (apartmentId: string) =>
  apiClient.get<STANDARD_RESPONSE<TENANT>>(`/apartments/${apartmentId}/tenants/active`);

export const addTenant = (apartmentId: string, data: Record<string, unknown>) =>
  apiClient.post<STANDARD_RESPONSE<TENANT>>(`/apartments/${apartmentId}/tenants`, data);

export const updateTenant = (
  apartmentId: string,
  tenantId: string,
  data: Record<string, unknown>,
) =>
  apiClient.put<STANDARD_RESPONSE<TENANT>>(
    `/apartments/${apartmentId}/tenants/${tenantId}`,
    data,
  );

export const markMovedOut = (
  apartmentId: string,
  tenantId: string,
  data: { move_out_date: string },
) =>
  apiClient.delete<STANDARD_RESPONSE<TENANT>>(
    `/apartments/${apartmentId}/tenants/${tenantId}`,
    { data },
  );
