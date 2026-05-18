import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import EmptyState from "./EmptyState";

describe("EmptyState", () => {
  it("renders title", () => {
    render(<EmptyState title="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<EmptyState title="Nothing here" description="Add something" />);
    expect(screen.getByText("Add something")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    render(<EmptyState title="Nothing here" />);
    expect(screen.queryByText("Add something")).not.toBeInTheDocument();
  });

  it("renders icon when provided", () => {
    render(<EmptyState title="Nothing here" icon={<span data-testid="icon">X</span>} />);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("does not render icon when not provided", () => {
    render(<EmptyState title="Nothing here" />);
    expect(screen.queryByTestId("icon")).not.toBeInTheDocument();
  });

  it("renders action button when provided", () => {
    render(
      <EmptyState
        title="Nothing here"
        action={<button>Add Item</button>}
      />
    );
    expect(screen.getByRole("button", { name: "Add Item" })).toBeInTheDocument();
  });

  it("does not render action when not provided", () => {
    render(<EmptyState title="Nothing here" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
