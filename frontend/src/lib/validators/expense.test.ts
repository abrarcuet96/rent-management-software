import { describe, expect, it } from "vitest";
import {
  expenseCategorySchema,
  expenseSchema,
  expenseUpdateSchema,
} from "./expense";

describe("expenseCategorySchema", () => {
  it("accepts valid category name", () => {
    const result = expenseCategorySchema.safeParse({ name: "Maintenance" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = expenseCategorySchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});

describe("expenseSchema", () => {
  it("accepts valid expense", () => {
    const result = expenseSchema.safeParse({
      category_public_id: "cat-123",
      description: "Pipe repair",
      amount: 5000,
      expense_date: "2025-01-15",
      is_tenant_charged: false,
    });
    expect(result.success).toBe(true);
  });

  it("accepts expense with building scope", () => {
    const result = expenseSchema.safeParse({
      category_public_id: "cat-123",
      building_public_id: "bld-123",
      description: "Pipe repair",
      amount: 5000,
      expense_date: "2025-01-15",
      is_tenant_charged: true,
    });
    expect(result.success).toBe(true);
  });

  it("defaults is_tenant_charged to false", () => {
    const result = expenseSchema.safeParse({
      category_public_id: "cat-123",
      description: "Pipe repair",
      amount: 5000,
      expense_date: "2025-01-15",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_tenant_charged).toBe(false);
    }
  });

  it("rejects missing category", () => {
    const result = expenseSchema.safeParse({
      category_public_id: "",
      description: "Pipe repair",
      amount: 5000,
      expense_date: "2025-01-15",
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero amount", () => {
    const result = expenseSchema.safeParse({
      category_public_id: "cat-123",
      description: "Pipe repair",
      amount: 0,
      expense_date: "2025-01-15",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty description", () => {
    const result = expenseSchema.safeParse({
      category_public_id: "cat-123",
      description: "",
      amount: 5000,
      expense_date: "2025-01-15",
    });
    expect(result.success).toBe(false);
  });
});

describe("expenseUpdateSchema", () => {
  it("accepts partial update with all fields", () => {
    const result = expenseUpdateSchema.safeParse({
      description: "Updated description",
      amount: 6000,
      expense_date: "2025-02-01",
      is_tenant_charged: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (no updates)", () => {
    const result = expenseUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts updating only description", () => {
    const result = expenseUpdateSchema.safeParse({
      description: "New description",
    });
    expect(result.success).toBe(true);
  });
});
