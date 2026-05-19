import type {
  EXPENSE,
  EXPENSE_CATEGORY,
  PAGINATED_RESPONSE,
  STANDARD_RESPONSE,
} from "@/types";
import apiClient from "./client";

export const getExpenseCategories = (params?: Record<string, unknown>) =>
  apiClient.get<PAGINATED_RESPONSE<EXPENSE_CATEGORY>>("/expense-categories", { params });

export const createExpenseCategory = (data: { name: string }) =>
  apiClient.post<STANDARD_RESPONSE<EXPENSE_CATEGORY>>("/expense-categories", data);

export const deleteExpenseCategory = (id: string) =>
  apiClient.delete<STANDARD_RESPONSE<null>>(`/expense-categories/${id}`);

export const getExpenses = (params?: Record<string, unknown>) =>
  apiClient.get<PAGINATED_RESPONSE<EXPENSE>>("/expenses", { params });

export const getExpenseById = (id: string) =>
  apiClient.get<STANDARD_RESPONSE<EXPENSE>>(`/expenses/${id}`);

export const createExpense = (data: {
  category_public_id: string;
  building_public_id?: string;
  apartment_public_id?: string;
  description: string;
  amount: number;
  expense_date: string;
  is_tenant_charged: boolean;
}) => apiClient.post<STANDARD_RESPONSE<EXPENSE>>("/expenses", data);

export const updateExpense = (
  id: string,
  data: {
    description?: string;
    amount?: number;
    expense_date?: string;
    is_tenant_charged?: boolean;
  },
) => apiClient.put<STANDARD_RESPONSE<EXPENSE>>(`/expenses/${id}`, data);

export const deleteExpense = (id: string) =>
  apiClient.delete<STANDARD_RESPONSE<null>>(`/expenses/${id}`);

export const chargeExpenseToTenants = (
  expenseId: string,
  tenantPublicIds: string[],
) =>
  apiClient.post<STANDARD_RESPONSE<{ charged: number; skipped: number }>>(
    `/expenses/${expenseId}/charge`,
    { tenant_public_ids: tenantPublicIds },
  );
