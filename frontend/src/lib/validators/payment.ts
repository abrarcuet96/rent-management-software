import { z } from "zod";

export const paymentSchema = z.object({
  amount: z.preprocess((v) => Number(v), z.number().min(0.01, "পরিমাণ প্রয়োজন")),
  paid_on: z.string().min(1, "তারিখ প্রয়োজন"),
  note: z.string().optional(),
});

export const bulkPaymentSchema = z.object({
  total_amount: z.preprocess((v) => Number(v), z.number().min(0.01, "পরিমাণ প্রয়োজন")),
  paid_on: z.string().min(1, "তারিখ প্রয়োজন"),
  note: z.string().optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
export type BulkPaymentInput = z.infer<typeof bulkPaymentSchema>;
