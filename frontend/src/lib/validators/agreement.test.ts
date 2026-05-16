import { describe, expect, it } from "vitest";
import { agreementSchema, bulkRentAdjustSchema } from "./agreement";

describe("agreementSchema", () => {
  it("accepts valid agreement data", () => {
    const result = agreementSchema.safeParse({
      rent_amount: 5000,
      start_date: "2025-01-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero rent_amount", () => {
    const result = agreementSchema.safeParse({
      rent_amount: 0,
      start_date: "2025-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty start_date", () => {
    const result = agreementSchema.safeParse({
      rent_amount: 5000,
      start_date: "",
    });
    expect(result.success).toBe(false);
  });

  it("coerces string rent_amount to number", () => {
    const result = agreementSchema.safeParse({
      rent_amount: "5000",
      start_date: "2025-01-01",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rent_amount).toBe(5000);
    }
  });
});

describe("bulkRentAdjustSchema", () => {
  it("accepts valid fixed adjustment", () => {
    const result = bulkRentAdjustSchema.safeParse({
      adjustment_type: "fixed",
      amount: 500,
      scope: "all",
      effective_date: "2025-02-01",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid percentage adjustment", () => {
    const result = bulkRentAdjustSchema.safeParse({
      adjustment_type: "percentage",
      amount: 10,
      scope: "all",
      effective_date: "2025-02-01",
    });
    expect(result.success).toBe(true);
  });

  it("accepts building scope with building_public_id", () => {
    const result = bulkRentAdjustSchema.safeParse({
      adjustment_type: "fixed",
      amount: 500,
      scope: "building",
      building_public_id: "abc-123",
      effective_date: "2025-02-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects building scope without building_public_id", () => {
    const result = bulkRentAdjustSchema.safeParse({
      adjustment_type: "fixed",
      amount: 500,
      scope: "building",
      effective_date: "2025-02-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero amount", () => {
    const result = bulkRentAdjustSchema.safeParse({
      adjustment_type: "fixed",
      amount: 0,
      scope: "all",
      effective_date: "2025-02-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty effective_date", () => {
    const result = bulkRentAdjustSchema.safeParse({
      adjustment_type: "fixed",
      amount: 500,
      scope: "all",
      effective_date: "",
    });
    expect(result.success).toBe(false);
  });
});
