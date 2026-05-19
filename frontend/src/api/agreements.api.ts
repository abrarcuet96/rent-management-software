import type { BULK_RENT_ADJUST_RESULT, STANDARD_RESPONSE, TENANT_AGREEMENT } from "@/types";
import apiClient from "./client";

export const getAgreements = (tenantId: string) =>
  apiClient.get<STANDARD_RESPONSE<TENANT_AGREEMENT[]>>(`/tenants/${tenantId}/agreements`);

export const createAgreement = (
  tenantId: string,
  data: { rent_amount: number; start_date: string; end_date?: string },
) => apiClient.post<STANDARD_RESPONSE<TENANT_AGREEMENT>>(`/tenants/${tenantId}/agreements`, data);

export const bulkAdjustRent = (data: {
  adjustment_type: "fixed" | "percentage";
  amount: number;
  scope: "all" | "building";
  building_public_id?: string;
  effective_date: string;
}) =>
  apiClient.post<STANDARD_RESPONSE<BULK_RENT_ADJUST_RESULT>>(
    "/agreements/bulk-adjust",
    data,
  );
