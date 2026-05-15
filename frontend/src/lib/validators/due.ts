import { z } from "zod";

export const dueSchema = z.object({
  month: z.preprocess((v) => Number(v), z.number().min(1, "মাস ১-১২ এর মধ্যে হতে হবে").max(12, "মাস ১-১২ এর মধ্যে হতে হবে")),
  year: z.preprocess((v) => Number(v), z.number().min(2000, "সালটি সঠিক নয়").max(2100, "সালটি সঠিক নয়")),
  due_date: z.string().optional(),
});

export type DueInput = z.infer<typeof dueSchema>;
