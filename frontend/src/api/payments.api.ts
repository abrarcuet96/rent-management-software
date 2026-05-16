import type { BulkPaymentHistoryItem, BulkPaymentResult, PaginatedResponse, PaymentRecord, StandardResponse } from "@/types";
import apiClient from "./client";

export const recordPayment = (
  dueId: string,
  data: { amount: number; paid_on: string; note?: string },
) => apiClient.post<StandardResponse<PaymentRecord>>(`/dues/${dueId}/payments`, data);

export const recordBulkPayment = (data: {
  tenant_public_id: string;
  total_amount: number;
  paid_on: string;
  note?: string;
}) => apiClient.post<StandardResponse<BulkPaymentResult>>("/payments/bulk", data);

export const getBulkPaymentHistory = (params?: Record<string, unknown>) =>
  apiClient.get<PaginatedResponse<BulkPaymentHistoryItem>>("/payments/bulk-history", { params });

export const getPayments = (dueId: string) =>
  apiClient.get<PaginatedResponse<PaymentRecord>>(`/dues/${dueId}/payments`);

export const refundPayment = (paymentId: string) =>
  apiClient.delete<StandardResponse<unknown>>(`/payments/${paymentId}`);
