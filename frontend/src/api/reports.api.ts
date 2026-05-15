import type { PaginatedResponse, StandardResponse } from "@/types";
import apiClient from "./client";

export const getPaymentHistory = (params: Record<string, unknown>) =>
  apiClient.get<PaginatedResponse<unknown>>("/reports/payment-history", { params });

export const getOverdueList = () =>
  apiClient.get<StandardResponse<unknown[]>>("/reports/overdue-list");
