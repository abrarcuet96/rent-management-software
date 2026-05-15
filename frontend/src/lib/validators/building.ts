import { z } from "zod";

export const buildingSchema = z.object({
  name: z.string().min(1, "বিল্ডিং এর নাম প্রয়োজন"),
  address: z.string().min(1, "ঠিকানা প্রয়োজন"),
  total_floors: z.preprocess((v) => Number(v), z.number().min(1, "কমপক্ষে ১ তলা হতে হবে")),
});

export type BuildingInput = z.infer<typeof buildingSchema>;
