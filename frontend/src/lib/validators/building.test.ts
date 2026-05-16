import { describe, expect, it } from "vitest";
import { buildingSchema } from "./building";

describe("buildingSchema", () => {
  it("accepts valid building data", () => {
    const result = buildingSchema.safeParse({
      name: "Sunshine Tower",
      address: "123 Main St",
      total_floors: 5,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = buildingSchema.safeParse({
      name: "",
      address: "123 Main St",
      total_floors: 5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty address", () => {
    const result = buildingSchema.safeParse({
      name: "Sunshine Tower",
      address: "",
      total_floors: 5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects total_floors of 0", () => {
    const result = buildingSchema.safeParse({
      name: "Sunshine Tower",
      address: "123 Main St",
      total_floors: 0,
    });
    expect(result.success).toBe(false);
  });

  it("coerces string total_floors to number", () => {
    const result = buildingSchema.safeParse({
      name: "Sunshine Tower",
      address: "123 Main St",
      total_floors: "5",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.total_floors).toBe(5);
    }
  });
});
