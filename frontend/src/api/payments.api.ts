import type { BULK_PAYMENT_HISTORY_ITEM, BULK_PAYMENT_RESULT, PAGINATED_RESPONSE, PAYMENT_RECORD, STANDARD_RESPONSE } from "@/types";
import apiClient from "./client";

export const recordPayment = (
  dueId: string,
  data: { amount: number; paid_on: string; note?: string },
) => apiClient.post<STANDARD_RESPONSE<PAYMENT_RECORD>>(`/dues/${dueId}/payments`, data);

export const recordBulkPayment = (data: {
  tenant_public_id: string;
  total_amount: number;
  paid_on: string;
  note?: string;
}) => apiClient.post<STANDARD_RESPONSE<BULK_PAYMENT_RESULT>>("/payments/bulk", data);

export const getBulkPaymentHistory = (params?: Record<string, unknown>) =>
  apiClient.get<PAGINATED_RESPONSE<BULK_PAYMENT_HISTORY_ITEM>>("/payments/bulk-history", { params });

export const getPayments = (dueId: string) =>
  apiClient.get<PAGINATED_RESPONSE<PAYMENT_RECORD>>(`/dues/${dueId}/payments`);

export const refundPayment = (paymentId: string) =>
  apiClient.delete<STANDARD_RESPONSE<unknown>>(`/payments/${paymentId}`);
