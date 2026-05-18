import type {
  Expense,
  ExpenseCategory,
  PaginatedResponse,
  StandardResponse,
} from "@/types";
import apiClient from "./client";

export const getExpenseCategories = (params?: Record<string, unknown>) =>
  apiClient.get<PaginatedResponse<ExpenseCategory>>("/expense-categories", { params });

export const createExpenseCategory = (data: { name: string }) =>
  apiClient.post<StandardResponse<ExpenseCategory>>("/expense-categories", data);

export const deleteExpenseCategory = (id: string) =>
  apiClient.delete<StandardResponse<null>>(`/expense-categories/${id}`);

export const getExpenses = (params?: Record<string, unknown>) =>
  apiClient.get<PaginatedResponse<Expense>>("/expenses", { params });

export const getExpenseById = (id: string) =>
  apiClient.get<StandardResponse<Expense>>(`/expenses/${id}`);

export const createExpense = (data: {
  category_public_id: string;
  building_public_id?: string;
  apartment_public_id?: string;
  description: string;
  amount: number;
  expense_date: string;
  is_tenant_charged: boolean;
}) => apiClient.post<StandardResponse<Expense>>("/expenses", data);

export const updateExpense = (
  id: string,
  data: {
    description?: string;
    amount?: number;
    expense_date?: string;
    is_tenant_charged?: boolean;
  },
) => apiClient.put<StandardResponse<Expense>>(`/expenses/${id}`, data);

export const deleteExpense = (id: string) =>
  apiClient.delete<StandardResponse<null>>(`/expenses/${id}`);

export const chargeExpenseToTenants = (
  expenseId: string,
  tenantPublicIds: string[],
) =>
  apiClient.post<StandardResponse<{ charged: number; skipped: number }>>(
    `/expenses/${expenseId}/charge`,
    { tenant_public_ids: tenantPublicIds },
  );
