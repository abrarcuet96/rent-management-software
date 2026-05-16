import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBadge from "./StatusBadge";

describe("StatusBadge", () => {
  it("renders paid status", () => {
    render(<StatusBadge status="paid" />);
    expect(screen.getByText("পরিশোধিত")).toBeInTheDocument();
  });

  it("renders partial status", () => {
    render(<StatusBadge status="partial" />);
    expect(screen.getByText("আংশিক")).toBeInTheDocument();
  });

  it("renders unpaid status", () => {
    render(<StatusBadge status="unpaid" />);
    expect(screen.getByText("বকেয়া")).toBeInTheDocument();
  });

  it("renders overdue status", () => {
    render(<StatusBadge status="overdue" />);
    expect(screen.getByText("মেয়াদোত্তীর্ণ")).toBeInTheDocument();
  });

  it("renders vacant status", () => {
    render(<StatusBadge status="vacant" />);
    expect(screen.getByText("খালি")).toBeInTheDocument();
  });

  it("renders occupied status", () => {
    render(<StatusBadge status="occupied" />);
    expect(screen.getByText("ভর্তি")).toBeInTheDocument();
  });

  it("renders active status", () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText("সক্রিয়")).toBeInTheDocument();
  });

  it("renders moved_out status", () => {
    render(<StatusBadge status="moved_out" />);
    expect(screen.getByText("চলে গেছে")).toBeInTheDocument();
  });

  it("applies success styles for paid", () => {
    render(<StatusBadge status="paid" />);
    const badge = screen.getByText("পরিশোধিত");
    expect(badge.className).toContain("bg-success-bg");
    expect(badge.className).toContain("text-success");
  });

  it("applies danger styles for unpaid", () => {
    render(<StatusBadge status="unpaid" />);
    const badge = screen.getByText("বকেয়া");
    expect(badge.className).toContain("bg-danger-bg");
    expect(badge.className).toContain("text-danger");
  });
});