import { formatCurrency, getMonthName } from "@/lib/utils";
import type { MonthlyDue } from "@/types";

interface BulkDistributionPreviewProps {
  dues: MonthlyDue[];
  totalAmount: number;
}

export default function BulkDistributionPreview({ dues, totalAmount }: BulkDistributionPreviewProps) {
  let remaining = totalAmount;
  let sumAfterRemaining = 0;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-neutral-bg">
          <tr>
            <th className="text-left px-3 py-2 font-medium text-text-secondary">মাস/বছর</th>
            <th className="text-right px-3 py-2 font-medium text-text-secondary">বকেয়া</th>
            <th className="text-right px-3 py-2 font-medium text-text-secondary">প্রযোজ্য</th>
            <th className="text-right px-3 py-2 font-medium text-text-secondary">বাকি</th>
          </tr>
        </thead>
        <tbody>
          {dues.map((due) => {
            const balance = parseFloat(due.remaining_balance);
            const apply = Math.min(balance, remaining);
            const afterRemaining = balance - apply;
            sumAfterRemaining += afterRemaining;
            remaining -= apply;
            return (
              <tr key={due.public_id} className="border-t border-border">
                <td className="px-3 py-2 text-text-primary">
                  {getMonthName(due.month)} {due.year}
                </td>
                <td className="px-3 py-2 text-right text-text-primary">
                  {formatCurrency(due.remaining_balance)}
                </td>
                <td className="px-3 py-2 text-right text-success font-medium">
                  {formatCurrency(apply)}
                </td>
                <td className="px-3 py-2 text-right text-text-secondary">
                  {formatCurrency(afterRemaining)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-neutral-bg">
          <tr>
            <td colSpan={2} className="px-3 py-2 font-medium text-text-primary">
              মোট
            </td>
            <td className="px-3 py-2 text-right font-medium text-success">
              {formatCurrency(totalAmount - remaining)}
            </td>
            <td className="px-3 py-2 text-right font-medium text-text-secondary">
              {sumAfterRemaining > 0 ? formatCurrency(sumAfterRemaining) : "৳০"}
            </td>
          </tr>
          {remaining > 0 && (
          <tr>
            <td colSpan={2} className="px-3 py-2 font-medium text-text-secondary">
              অব্যবহৃত
            </td>
            <td className="px-3 py-2 text-right text-text-secondary">
              {formatCurrency(remaining)}
            </td>
            <td></td>
          </tr>
          )}
        </tfoot>
      </table>
    </div>
  );
}
