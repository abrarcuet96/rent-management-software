import type { BulkRentAdjustResult, StandardResponse, TenantAgreement } from "@/types";
import apiClient from "./client";

export const getAgreements = (tenantId: string) =>
  apiClient.get<StandardResponse<TenantAgreement[]>>(`/tenants/${tenantId}/agreements`);

export const createAgreement = (
  tenantId: string,
  data: { rent_amount: number; start_date: string; end_date?: string },
) => apiClient.post<StandardResponse<TenantAgreement>>(`/tenants/${tenantId}/agreements`, data);

export const bulkAdjustRent = (data: {
  adjustment_type: "fixed" | "percentage";
  amount: number;
  scope: "all" | "building";
  building_public_id?: string;
  effective_date: string;
}) =>
  apiClient.post<StandardResponse<BulkRentAdjustResult>>(
    "/agreements/bulk-adjust",
    data,
  );
