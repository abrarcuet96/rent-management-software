import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { formatCurrency, getMonthName } from "@/lib/utils";
import type { MonthlyDue } from "@/types";
import { CreditCard } from "lucide-react";

interface MonthlyDueRowProps {
  due: MonthlyDue;
  onPay: () => void;
}

export default function MonthlyDueRow({ due, onPay }: MonthlyDueRowProps) {
  return (
    <tr className="border-t border-border hover:bg-neutral-bg">
      <td className="px-3 py-3 text-text-primary">
        {getMonthName(due.month)} {due.year}
      </td>
      <td className="px-3 py-3 text-right text-text-primary">
        {formatCurrency(due.total_due)}
      </td>
      <td className="px-3 py-3 text-right text-success">
        {formatCurrency(due.amount_paid)}
      </td>
      <td className="px-3 py-3 text-right font-medium text-text-primary">
        {formatCurrency(due.remaining_balance)}
      </td>
      <td className="px-3 py-3 text-center">
        <StatusBadge status={due.status} />
      </td>
      <td className="px-3 py-3 text-right">
        {due.status !== "paid" && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onPay}
          >
            <CreditCard size={13} className="mr-1" />
            পরিশোধ
          </Button>
        )}
      </td>
    </tr>
  );
}
