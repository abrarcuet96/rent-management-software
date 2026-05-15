import { z } from "zod";

export const tenantSchema = z.object({
  full_name: z.string().min(2, "নাম কমপক্ষে ২ অক্ষর হতে হবে"),
  phone: z.string().min(7, "সঠিক ফোন নম্বর দিন"),
  nid_number: z.string().optional(),
  address: z.string().optional(),
  member_count: z.preprocess((v) => Number(v), z.number().min(1, "কমপক্ষে ১ জন সদস্য")),
  move_in_date: z.string().min(1, "প্রবেশের তারিখ প্রয়োজন"),
  initial_rent_amount: z.preprocess((v) => Number(v), z.number().min(1, "ভাড়ার পরিমাণ প্রয়োজন")),
  agreement_start_date: z.string().min(1, "চুক্তির তারিখ প্রয়োজন"),
});

export const editTenantSchema = z.object({
  full_name: z.string().min(2, "নাম কমপক্ষে ২ অক্ষর হতে হবে"),
  phone: z.string().min(7, "সঠিক ফোন নম্বর দিন"),
  nid_number: z.string().optional(),
});

export type TenantInput = z.infer<typeof tenantSchema>;
export type EditTenantInput = z.infer<typeof editTenantSchema>;
