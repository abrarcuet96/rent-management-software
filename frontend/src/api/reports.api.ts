import type { PAGINATED_RESPONSE, STANDARD_RESPONSE } from "@/types";
import apiClient from "./client";

export const getPaymentHistory = (params: Record<string, unknown>) =>
  apiClient.get<PAGINATED_RESPONSE<unknown>>("/reports/payment-history", { params });

export const getOverdueList = () =>
  apiClient.get<STANDARD_RESPONSE<unknown[]>>("/reports/overdue-list");

export const getAnnualSummary = (year: number) =>
  apiClient.get<STANDARD_RESPONSE<unknown>>("/reports/annual-summary", { params: { year } });
