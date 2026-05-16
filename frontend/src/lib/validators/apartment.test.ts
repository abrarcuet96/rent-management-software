import { describe, expect, it } from "vitest";
import { apartmentSchema } from "./apartment";

describe("apartmentSchema", () => {
  it("accepts valid apartment data", () => {
    const result = apartmentSchema.safeParse({
      unit_number: "A-101",
      floor: 1,
    });
    expect(result.success).toBe(true);
  });

  it("defaults status to vacant when not provided", () => {
    const result = apartmentSchema.safeParse({
      unit_number: "A-101",
      floor: 1,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("vacant");
    }
  });

  it("accepts occupied status", () => {
    const result = apartmentSchema.safeParse({
      unit_number: "A-101",
      floor: 1,
      status: "occupied",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty unit_number", () => {
    const result = apartmentSchema.safeParse({
      unit_number: "",
      floor: 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects floor of 0", () => {
    const result = apartmentSchema.safeParse({
      unit_number: "A-101",
      floor: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const result = apartmentSchema.safeParse({
      unit_number: "A-101",
      floor: 1,
      status: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("coerces string floor to number", () => {
    const result = apartmentSchema.safeParse({
      unit_number: "A-101",
      floor: "3",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.floor).toBe(3);
    }
  });
});
