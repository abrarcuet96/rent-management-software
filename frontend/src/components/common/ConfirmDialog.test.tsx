import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmDialog from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  it("renders title when open", () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Delete item?"
        onConfirm={() => {}}
      />
    );
    expect(screen.getByText("Delete item?")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Delete item?"
        description="This action cannot be undone."
        onConfirm={() => {}}
      />
    );
    expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Delete item?"
        onConfirm={() => {}}
      />
    );
    expect(screen.queryByText("This action cannot be undone.")).not.toBeInTheDocument();
  });

  it("calls onConfirm when confirm button is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Delete item?"
        onConfirm={onConfirm}
      />
    );
    await user.click(screen.getByRole("button", { name: /নিশ্চিত করুন/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onOpenChange(false) when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Delete item?"
        onConfirm={() => {}}
      />
    );
    await user.click(screen.getByRole("button", { name: /বাতিল করুন/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("disables buttons when isPending is true", () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Delete item?"
        onConfirm={() => {}}
        isPending={true}
      />
    );
    expect(screen.getByRole("button", { name: /নিশ্চিত করুন/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /বাতিল করুন/i })).toBeDisabled();
  });

  it("renders custom confirm label", () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Delete item?"
        onConfirm={() => {}}
        confirmLabel="হ্যাঁ, মুছুন"
      />
    );
    expect(screen.getByRole("button", { name: /হ্যাঁ, মুছুন/i })).toBeInTheDocument();
  });
});