import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatDate,
  getMonthName,
  calculateDaysOverdue,
} from "./utils";

describe("formatCurrency", () => {
  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("৳০");
  });

  it("formats positive integer", () => {
    expect(formatCurrency(500)).toBe("৳৫০০");
  });

  it("formats decimal value", () => {
    expect(formatCurrency(1500.5)).toBe("৳১,৫০০.৫");
  });

  it("formats large value with grouping", () => {
    expect(formatCurrency(25000)).toBe("৳২৫,০০০");
  });
});

describe("getMonthName", () => {
  it("returns correct Bengali month for 1-12", () => {
    expect(getMonthName(1)).toBe("জানুয়ারি");
    expect(getMonthName(6)).toBe("জুন");
    expect(getMonthName(12)).toBe("ডিসেম্বর");
  });

  it("returns empty string for 0", () => {
    expect(getMonthName(0)).toBe("");
  });

  it("returns empty string for 13", () => {
    expect(getMonthName(13)).toBe("");
  });
});

describe("formatDate", () => {
  it("formats a valid date string", () => {
    const result = formatDate("2025-01-15");
    expect(result).toBeTruthy();
    expect(result).toContain("২০২৫");
  });

  it("returns empty string for empty input", () => {
    expect(formatDate("")).toBe("");
  });
});

describe("calculateDaysOverdue", () => {
  it("returns 0 for future date", () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    expect(calculateDaysOverdue(future.toISOString())).toBe(0);
  });

  it("returns positive number for past date", () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    expect(calculateDaysOverdue(past.toISOString())).toBeGreaterThanOrEqual(5);
  });

  it("returns 0 for empty string", () => {
    expect(calculateDaysOverdue("")).toBe(0);
  });

  it("returns 0 for today", () => {
    const today = new Date().toISOString();
    expect(calculateDaysOverdue(today)).toBe(0);
  });
});
