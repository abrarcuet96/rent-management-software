import { z } from "zod";

export const expenseCategorySchema = z.object({
  name: z.string().min(1, "ক্যাটাগরির নাম প্রয়োজন"),
});

export const expenseSchema = z.object({
  category_public_id: z.string().min(1, "ক্যাটাগরি প্রয়োজন"),
  building_public_id: z.string().optional(),
  apartment_public_id: z.string().optional(),
  description: z.string().min(1, "বিবরণ প্রয়োজন"),
  amount: z.preprocess((v) => Number(v), z.number().min(0.01, "পরিমাণ প্রয়োজন")),
  expense_date: z.string().min(1, "তারিখ প্রয়োজন"),
  is_tenant_charged: z.boolean().default(false),
});

export const expenseUpdateSchema = z.object({
  description: z.string().min(1, "বিবরণ প্রয়োজন").optional(),
  amount: z.preprocess(
    (v) => (v === undefined || v === null || v === "" ? undefined : Number(v)),
    z.number().min(0.01, "পরিমাণ প্রয়োজন").optional(),
  ),
  expense_date: z.string().min(1, "তারিখ প্রয়োজন").optional(),
  is_tenant_charged: z.boolean().optional(),
});

export type ExpenseCategoryInput = z.infer<typeof expenseCategorySchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type ExpenseUpdateInput = z.infer<typeof expenseUpdateSchema>;
