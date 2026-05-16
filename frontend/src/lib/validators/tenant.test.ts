import { describe, expect, it } from "vitest";
import { tenantSchema, editTenantSchema } from "./tenant";

describe("tenantSchema", () => {
  it("accepts valid tenant data", () => {
    const result = tenantSchema.safeParse({
      full_name: "Rahim",
      phone: "01712345678",
      member_count: 3,
      move_in_date: "2025-01-01",
      initial_rent_amount: 5000,
      agreement_start_date: "2025-01-01",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional fields as undefined", () => {
    const result = tenantSchema.safeParse({
      full_name: "Rahim",
      phone: "01712345678",
      member_count: 1,
      move_in_date: "2025-01-01",
      initial_rent_amount: 5000,
      agreement_start_date: "2025-01-01",
      nid_number: undefined,
      address: undefined,
    });
    expect(result.success).toBe(true);
  });

  it("rejects name shorter than 2 chars", () => {
    const result = tenantSchema.safeParse({
      full_name: "R",
      phone: "01712345678",
      member_count: 1,
      move_in_date: "2025-01-01",
      initial_rent_amount: 5000,
      agreement_start_date: "2025-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects phone shorter than 7 chars", () => {
    const result = tenantSchema.safeParse({
      full_name: "Rahim",
      phone: "123456",
      member_count: 1,
      move_in_date: "2025-01-01",
      initial_rent_amount: 5000,
      agreement_start_date: "2025-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects member_count of 0", () => {
    const result = tenantSchema.safeParse({
      full_name: "Rahim",
      phone: "01712345678",
      member_count: 0,
      move_in_date: "2025-01-01",
      initial_rent_amount: 5000,
      agreement_start_date: "2025-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects initial_rent_amount of 0", () => {
    const result = tenantSchema.safeParse({
      full_name: "Rahim",
      phone: "01712345678",
      member_count: 1,
      move_in_date: "2025-01-01",
      initial_rent_amount: 0,
      agreement_start_date: "2025-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing move_in_date", () => {
    const result = tenantSchema.safeParse({
      full_name: "Rahim",
      phone: "01712345678",
      member_count: 1,
      move_in_date: "",
      initial_rent_amount: 5000,
      agreement_start_date: "2025-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("coerces string member_count and initial_rent_amount to numbers", () => {
    const result = tenantSchema.safeParse({
      full_name: "Rahim",
      phone: "01712345678",
      member_count: "3",
      move_in_date: "2025-01-01",
      initial_rent_amount: "5000",
      agreement_start_date: "2025-01-01",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.member_count).toBe(3);
      expect(result.data.initial_rent_amount).toBe(5000);
    }
  });
});

describe("editTenantSchema", () => {
  it("accepts valid edit data", () => {
    const result = editTenantSchema.safeParse({
      full_name: "Rahim Updated",
      phone: "01712345678",
    });
    expect(result.success).toBe(true);
  });

  it("rejects name shorter than 2 chars", () => {
    const result = editTenantSchema.safeParse({
      full_name: "R",
      phone: "01712345678",
    });
    expect(result.success).toBe(false);
  });

  it("rejects phone shorter than 7 chars", () => {
    const result = editTenantSchema.safeParse({
      full_name: "Rahim",
      phone: "123456",
    });
    expect(result.success).toBe(false);
  });
});