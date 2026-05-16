import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import BulkDistributionPreview from "./BulkDistributionPreview";
import type { MonthlyDue } from "@/types";

function makeDue(overrides: Partial<MonthlyDue>): MonthlyDue {
  return {
    public_id: "due-1",
    tenant_public_id: "tenant-1",
    agreement_public_id: "agreement-1",
    month: 1,
    year: 2025,
    rent_amount: 5000,
    total_due: 5000,
    amount_paid: 0,
    remaining_balance: 5000,
    status: "unpaid",
    is_auto_generated: true,
    created_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("BulkDistributionPreview", () => {
  it("distributes exact amount across 3 dues", () => {
    const dues = [
      makeDue({ public_id: "due-1", month: 1, year: 2025, remaining_balance: 5000 }),
      makeDue({ public_id: "due-2", month: 2, year: 2025, remaining_balance: 5000 }),
      makeDue({ public_id: "due-3", month: 3, year: 2025, remaining_balance: 5000 }),
    ];

    render(<BulkDistributionPreview dues={dues} totalAmount={15000} />);

    expect(screen.getByText(/জানুয়ারি 2025/)).toBeInTheDocument();
    expect(screen.getByText(/ফেব্রুয়ারি 2025/)).toBeInTheDocument();
    expect(screen.getByText(/মার্চ 2025/)).toBeInTheDocument();
  });

  it("shows partial distribution when amount is less than total owed", () => {
    const dues = [
      makeDue({ public_id: "due-1", month: 1, remaining_balance: 5000 }),
      makeDue({ public_id: "due-2", month: 2, remaining_balance: 5000 }),
    ];

    render(<BulkDistributionPreview dues={dues} totalAmount={7000} />);

    expect(screen.getByText(/জানুয়ারি/)).toBeInTheDocument();
    expect(screen.getByText(/ফেব্রুয়ারি/)).toBeInTheDocument();
  });

  it("shows excess as unapplied in footer", () => {
    const dues = [
      makeDue({ public_id: "due-1", remaining_balance: 5000 }),
    ];

    render(<BulkDistributionPreview dues={dues} totalAmount={7000} />);

    expect(screen.getByText("অব্যবহৃত")).toBeInTheDocument();
    expect(screen.getByText("৳2,000.00")).toBeInTheDocument();
  });

  it("renders empty table for zero amount", () => {
    const dues = [
      makeDue({ public_id: "due-1", remaining_balance: 5000 }),
    ];

    render(<BulkDistributionPreview dues={dues} totalAmount={0} />);

    const appliedCells = screen.getAllByRole("cell");
    expect(appliedCells.length).toBeGreaterThan(0);
  });

  it("renders table with headers for empty dues", () => {
    render(<BulkDistributionPreview dues={[]} totalAmount={5000} />);

    expect(screen.getByText("মাস/বছর")).toBeInTheDocument();
    expect(screen.getByText("বকেয়া")).toBeInTheDocument();
  });
});