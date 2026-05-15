import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "ইমেইল আবশ্যক")
    .email("সঠিক ইমেইল ঠিকানা দিন"),
  password: z
    .string()
    .min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"),
});

export const registerSchema = z
  .object({
    full_name: z
      .string()
      .min(2, "নাম কমপক্ষে ২ অক্ষরের হতে হবে"),
    email: z
      .string()
      .min(1, "ইমেইল আবশ্যক")
      .email("সঠিক ইমেইল ঠিকানা দিন"),
    password: z
      .string()
      .min(8, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে"),
    confirmPassword: z
      .string()
      .min(1, "পাসওয়ার্ড নিশ্চিত করুন"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "পাসওয়ার্ড মিলছে না",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
