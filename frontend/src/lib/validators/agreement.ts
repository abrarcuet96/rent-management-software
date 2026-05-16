import { z } from "zod";

export const agreementSchema = z.object({
  rent_amount: z.preprocess(
    (v) => Number(v),
    z.number().min(0.01, "ভাড়ার পরিমাণ প্রয়োজন"),
  ),
  start_date: z.string().min(1, "শুরুর তারিখ প্রয়োজন"),
});

export const bulkRentAdjustSchema = z
  .object({
    adjustment_type: z.enum(["fixed", "percentage"]),
    amount: z.preprocess(
      (v) => Number(v),
      z.number().refine((v) => v !== 0, {
        message: "পরিমাণ ০ হতে পারে না",
      }),
    ),
    scope: z.enum(["all", "building"]),
    building_public_id: z.string().optional(),
    effective_date: z.string().min(1, "কার্যকর তারিখ প্রয়োজন"),
  })
  .refine(
    (data) => {
      if (data.scope === "building" && !data.building_public_id) {
        return false;
      }
      return true;
    },
    {
      message: "বিল্ডিং স্কোপে বিল্ডিং প্রয়োজন",
      path: ["building_public_id"],
    },
  );

export type AgreementInput = z.infer<typeof agreementSchema>;
export type BulkRentAdjustInput = z.infer<typeof bulkRentAdjustSchema>;
