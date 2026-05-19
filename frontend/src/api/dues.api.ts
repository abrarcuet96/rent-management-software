import type { BULK_DUE_GENERATE_RESULT, MONTHLY_DUE, PAGINATED_RESPONSE, PENDING_DUE_COUNT, STANDARD_RESPONSE } from "@/types";
import apiClient from "./client";

export const getDues = (tenantId: string, params?: Record<string, unknown>) =>
  apiClient.get<PAGINATED_RESPONSE<MONTHLY_DUE>>(`/tenants/${tenantId}/dues`, { params });

export const generateDue = (
  tenantId: string,
  data: { month: number; year: number; due_date?: string },
) => apiClient.post<STANDARD_RESPONSE<MONTHLY_DUE>>(`/tenants/${tenantId}/dues/generate`, data);

export const adjustDue = (dueId: string, data: Record<string, unknown>) =>
  apiClient.put<STANDARD_RESPONSE<MONTHLY_DUE>>(`/dues/${dueId}`, data);

export const getPendingDueCount = (month: number, year: number) =>
  apiClient.get<STANDARD_RESPONSE<PENDING_DUE_COUNT>>("/dues/pending-count", {
    params: { month, year },
  });

export const generateBulkDue = (data: { month: number; year: number; due_date?: string }) =>
  apiClient.post<STANDARD_RESPONSE<BULK_DUE_GENERATE_RESULT>>("/dues/generate-bulk", data);
