import StatusBadge from "@/components/common/StatusBadge";
import DuePaymentHistory from "@/components/dues/DuePaymentHistory";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatCurrency, getMonthName, toBn } from "@/lib/utils";
import type { MONTHLY_DUE } from "@/types";
import { ChevronDown, ChevronRight, CreditCard, Edit2 } from "lucide-react";

interface MonthlyDueRowProps {
  due: MONTHLY_DUE;
  onPay: () => void;
  onAdjust: () => void;
  expanded: boolean;
  onToggle: () => void;
}

export default function MonthlyDueRow({ due, onPay, onAdjust, expanded, onToggle }: MonthlyDueRowProps) {
  return (
    <>
      <TableRow
        className="border-t border-border hover:bg-neutral-bg cursor-pointer"
        onClick={onToggle}
      >
        <TableCell className="px-3 py-3 text-text-primary whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            {expanded ? (
              <ChevronDown size={14} className="text-text-secondary shrink-0" />
            ) : (
              <ChevronRight size={14} className="text-text-secondary shrink-0" />
            )}
            {getMonthName(due.month)} {toBn(due.year)}
          </div>
        </TableCell>
        <TableCell className="px-3 py-3 text-right text-text-primary whitespace-nowrap">
          {formatCurrency(due.total_due)}
        </TableCell>
        <TableCell className="px-3 py-3 text-right text-success whitespace-nowrap">
          {formatCurrency(due.amount_paid)}
        </TableCell>
        <TableCell className="px-3 py-3 text-right font-medium text-text-primary whitespace-nowrap">
          {formatCurrency(due.remaining_balance)}
        </TableCell>
        <TableCell className="px-3 py-3 text-center whitespace-nowrap">
          <StatusBadge status={due.status} />
        </TableCell>
        <TableCell className="px-3 py-3 text-right whitespace-nowrap print:hidden">
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
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow key={`${due.public_id}-payments`} className="border-t border-border bg-neutral-bg/50">
          <TableCell colSpan={6} className="p-0">
            <DuePaymentHistory dueId={due.public_id} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
