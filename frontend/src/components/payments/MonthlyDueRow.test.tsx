import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MonthlyDueRow from "./MonthlyDueRow";
import type { MonthlyDue } from "@/types";

vi.mock("@/components/dues/DuePaymentHistory", () => ({
  default: () => <div data-testid="payment-history">Payment History</div>,
}));

function makeDue(overrides: Partial<MonthlyDue> = {}): MonthlyDue {
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

describe("MonthlyDueRow", () => {
  it("renders month/year and amounts", () => {
    const due = makeDue({
      month: 3,
      year: 2025,
      total_due: 5000,
      amount_paid: 2000,
      remaining_balance: 3000,
    });

    render(<MonthlyDueRow due={due} onPay={() => {}} onAdjust={() => {}} />);

    expect(screen.getByText(/মার্চ 2025/)).toBeInTheDocument();
  });

  it("renders status badge for unpaid due", () => {
    const due = makeDue({ status: "unpaid" });
    render(<MonthlyDueRow due={due} onPay={() => {}} onAdjust={() => {}} />);
    expect(screen.getByText("বকেয়া")).toBeInTheDocument();
  });

  it("renders status badge for paid due", () => {
    const due = makeDue({ status: "paid" });
    render(<MonthlyDueRow due={due} onPay={() => {}} onAdjust={() => {}} />);
    expect(screen.getByText("পরিশোধিত")).toBeInTheDocument();
  });

  it("does not show pay button for paid due", () => {
    const due = makeDue({ status: "paid" });
    render(<MonthlyDueRow due={due} onPay={() => {}} onAdjust={() => {}} />);
    expect(screen.queryByText("পরিশোধ")).not.toBeInTheDocument();
  });

  it("shows pay button for unpaid due", () => {
    const due = makeDue({ status: "unpaid" });
    render(<MonthlyDueRow due={due} onPay={() => {}} onAdjust={() => {}} />);
    expect(screen.getByText("পরিশোধ")).toBeInTheDocument();
  });

  it("calls onPay when pay button is clicked", async () => {
    const user = userEvent.setup();
    const onPay = vi.fn();
    const due = makeDue({ status: "unpaid" });
    render(<MonthlyDueRow due={due} onPay={onPay} onAdjust={() => {}} />);

    await user.click(screen.getByText("পরিশোধ"));
    expect(onPay).toHaveBeenCalledOnce();
  });

  it("calls onAdjust when adjust button is clicked", async () => {
    const user = userEvent.setup();
    const onAdjust = vi.fn();
    const due = makeDue({ status: "unpaid" });
    render(<MonthlyDueRow due={due} onPay={() => {}} onAdjust={onAdjust} />);

    await user.click(screen.getByText("সম্পাদনা"));
    expect(onAdjust).toHaveBeenCalledOnce();
  });

  it("does not show adjust button for paid due", () => {
    const due = makeDue({ status: "paid" });
    render(<MonthlyDueRow due={due} onPay={() => {}} onAdjust={() => {}} />);
    expect(screen.queryByText("সম্পাদনা")).not.toBeInTheDocument();
  });

  it("does not show adjust button for partial due", () => {
    const due = makeDue({ status: "partial" });
    render(<MonthlyDueRow due={due} onPay={() => {}} onAdjust={() => {}} />);
    expect(screen.queryByText("সম্পাদনা")).not.toBeInTheDocument();
  });

  it("shows adjust button for unpaid due", () => {
    const due = makeDue({ status: "unpaid" });
    render(<MonthlyDueRow due={due} onPay={() => {}} onAdjust={() => {}} />);
    expect(screen.getByText("সম্পাদনা")).toBeInTheDocument();
  });

  it("expands payment history when row is clicked", async () => {
    const user = userEvent.setup();
    const due = makeDue();
    render(<MonthlyDueRow due={due} onPay={() => {}} onAdjust={() => {}} />);

    const row = screen.getByText(/জানুয়ারি 2025/).closest("tr")!;
    await user.click(row);

    expect(screen.getByTestId("payment-history")).toBeInTheDocument();
  });
});