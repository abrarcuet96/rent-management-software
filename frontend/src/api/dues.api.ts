import type { MonthlyDue, PaginatedResponse, StandardResponse } from "@/types";
import apiClient from "./client";

export const getDues = (tenantId: string, params?: Record<string, unknown>) =>
  apiClient.get<PaginatedResponse<MonthlyDue>>(`/tenants/${tenantId}/dues`, { params });

export const generateDue = (
  tenantId: string,
  data: { month: number; year: number; due_date?: string },
) => apiClient.post<StandardResponse<MonthlyDue>>(`/tenants/${tenantId}/dues/generate`, data);

export const adjustDue = (dueId: string, data: Record<string, unknown>) =>
  apiClient.put<StandardResponse<MonthlyDue>>(`/dues/${dueId}`, data);
