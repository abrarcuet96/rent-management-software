import type { DashboardSummary, StandardResponse } from "@/types";
import apiClient from "./client";

export const getDashboardSummary = (params?: { month?: number; year?: number }) =>
  apiClient.get<StandardResponse<DashboardSummary>>("/dashboard/summary", { params });
