import { describe, expect, it } from "vitest";
import { paymentSchema, bulkPaymentSchema } from "./payment";

describe("paymentSchema", () => {
  it("accepts valid payment", () => {
    const result = paymentSchema.safeParse({
      amount: 500,
      paid_on: "2025-01-15",
    });
    expect(result.success).toBe(true);
  });

  it("accepts payment with note", () => {
    const result = paymentSchema.safeParse({
      amount: 500,
      paid_on: "2025-01-15",
      note: "Cash payment",
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero amount", () => {
    const result = paymentSchema.safeParse({
      amount: 0,
      paid_on: "2025-01-15",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative amount", () => {
    const result = paymentSchema.safeParse({
      amount: -100,
      paid_on: "2025-01-15",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing date", () => {
    const result = paymentSchema.safeParse({
      amount: 500,
      paid_on: "",
    });
    expect(result.success).toBe(false);
  });

  it("coerces string amount to number", () => {
    const result = paymentSchema.safeParse({
      amount: "500",
      paid_on: "2025-01-15",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(500);
    }
  });
});

describe("paymentSchema - amount validation", () => {
  it("rejects amount with string 0", () => {
    const result = paymentSchema.safeParse({ amount: "0", paid_on: "2025-01-15" });
    expect(result.success).toBe(false);
  });
});

describe("bulkPaymentSchema", () => {
  it("accepts valid bulk payment", () => {
    const result = bulkPaymentSchema.safeParse({
      total_amount: 1500,
      paid_on: "2025-01-15",
    });
    expect(result.success).toBe(true);
  });

  it("accepts bulk payment with note", () => {
    const result = bulkPaymentSchema.safeParse({
      total_amount: 1500,
      paid_on: "2025-01-15",
      note: "January rent",
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero total amount", () => {
    const result = bulkPaymentSchema.safeParse({
      total_amount: 0,
      paid_on: "2025-01-15",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing date", () => {
    const result = bulkPaymentSchema.safeParse({
      total_amount: 1500,
      paid_on: "",
    });
    expect(result.success).toBe(false);
  });

  it("coerces string total_amount to number", () => {
    const result = bulkPaymentSchema.safeParse({
      total_amount: "1500",
      paid_on: "2025-01-15",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.total_amount).toBe(1500);
    }
  });
});