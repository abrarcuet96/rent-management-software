import { describe, expect, it } from "vitest";
import { dueSchema } from "./due";

describe("dueSchema", () => {
  it("accepts valid due data", () => {
    const result = dueSchema.safeParse({
      month: 1,
      year: 2025,
    });
    expect(result.success).toBe(true);
  });

  it("accepts month 12", () => {
    const result = dueSchema.safeParse({
      month: 12,
      year: 2025,
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional due_date", () => {
    const result = dueSchema.safeParse({
      month: 6,
      year: 2025,
      due_date: "2025-06-05",
    });
    expect(result.success).toBe(true);
  });

  it("rejects month 0", () => {
    const result = dueSchema.safeParse({
      month: 0,
      year: 2025,
    });
    expect(result.success).toBe(false);
  });

  it("rejects month 13", () => {
    const result = dueSchema.safeParse({
      month: 13,
      year: 2025,
    });
    expect(result.success).toBe(false);
  });

  it("rejects year below 2000", () => {
    const result = dueSchema.safeParse({
      month: 1,
      year: 1999,
    });
    expect(result.success).toBe(false);
  });

  it("rejects year above 2100", () => {
    const result = dueSchema.safeParse({
      month: 1,
      year: 2101,
    });
    expect(result.success).toBe(false);
  });

  it("coerces string month and year to numbers", () => {
    const result = dueSchema.safeParse({
      month: "6",
      year: "2025",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.month).toBe(6);
      expect(result.data.year).toBe(2025);
    }
  });
});
