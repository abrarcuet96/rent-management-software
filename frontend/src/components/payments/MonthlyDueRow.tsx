import StatusBadge from "@/components/common/StatusBadge";
import DuePaymentHistory from "@/components/dues/DuePaymentHistory";
import { Button } from "@/components/ui/button";
import { formatCurrency, getMonthName } from "@/lib/utils";
import type { MonthlyDue } from "@/types";
import { ChevronDown, ChevronRight, CreditCard, Edit2 } from "lucide-react";

interface MonthlyDueRowProps {
  due: MonthlyDue;
  onPay: () => void;
  onAdjust: () => void;
  expanded: boolean;
  onToggle: () => void;
}

export default function MonthlyDueRow({ due, onPay, onAdjust, expanded, onToggle }: MonthlyDueRowProps) {
  return (
    <>
      <tr
        className="border-t border-border hover:bg-neutral-bg cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-3 py-3 text-text-primary whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            {expanded ? (
              <ChevronDown size={14} className="text-text-secondary shrink-0" />
            ) : (
              <ChevronRight size={14} className="text-text-secondary shrink-0" />
            )}
            {getMonthName(due.month)} {due.year}
          </div>
        </td>
        <td className="px-3 py-3 text-right text-text-primary whitespace-nowrap">
          {formatCurrency(due.total_due)}
        </td>
        <td className="px-3 py-3 text-right text-success whitespace-nowrap">
          {formatCurrency(due.amount_paid)}
        </td>
        <td className="px-3 py-3 text-right font-medium text-text-primary whitespace-nowrap">
          {formatCurrency(due.remaining_balance)}
        </td>
        <td className="px-3 py-3 text-center whitespace-nowrap">
          <StatusBadge status={due.status} />
        </td>
        <td className="px-3 py-3 text-right whitespace-nowrap print:hidden">
          <div className="flex items-center justify-end gap-1">
            {due.status === "unpaid" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onAdjust();
              }}
            >
              <Edit2 size={13} className="mr-1" />
              সম্পাদনা
            </Button>
            )}
            {due.status !== "paid" && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onPay();
                }}
              >
                <CreditCard size={13} className="mr-1" />
                পরিশোধ
              </Button>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr key={`${due.public_id}-payments`} className="border-t border-border bg-neutral-bg/50">
          <td colSpan={6} className="p-0">
            <DuePaymentHistory dueId={due.public_id} />
          </td>
        </tr>
      )}
    </>
  );
}
