import { cn } from "@/lib/utils";

type StatusType =
  | "paid"
  | "partial"
  | "unpaid"
  | "overdue"
  | "vacant"
  | "occupied"
  | "active"
  | "moved_out";

const STATUS_CONFIG: Record<StatusType, { label: string; className: string }> = {
  paid: { label: "পরিশোধিত", className: "bg-success-bg text-success" },
  partial: { label: "আংশিক", className: "bg-warning-bg text-warning" },
  unpaid: { label: "বকেয়া", className: "bg-danger-bg text-danger" },
  overdue: { label: "মেয়াদোত্তীর্ণ", className: "bg-danger-bg text-danger" },
  vacant: { label: "খালি", className: "bg-neutral-bg text-text-secondary" },
  occupied: { label: "ভর্তি", className: "bg-success-bg text-success" },
  active: { label: "সক্রিয়", className: "bg-success-bg text-success" },
  moved_out: { label: "চলে গেছে", className: "bg-neutral-bg text-text-secondary" },
};

interface StatusBadgeProps {
  status: StatusType;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", config.className)}>
      {config.label}
    </span>
  );
}
