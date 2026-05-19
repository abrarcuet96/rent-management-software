import type { DASHBOARD_SUMMARY, STANDARD_RESPONSE } from "@/types";
import apiClient from "./client";

export const getDashboardSummary = (params?: { month?: number; year?: number }) =>
  apiClient.get<STANDARD_RESPONSE<DASHBOARD_SUMMARY>>("/dashboard/summary", { params });
