import { z } from "zod";

export const apartmentSchema = z.object({
  unit_number: z.string().min(1, "ইউনিট নম্বর প্রয়োজন"),
  floor: z.coerce.number().min(1, "তলা নম্বর প্রয়োজন"),
  status: z.enum(["vacant", "occupied"]).default("vacant"),
});

export type ApartmentInput = z.infer<typeof apartmentSchema>;
