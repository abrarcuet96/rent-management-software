import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      <Table className="text-sm">
        <TableHeader className="bg-neutral-bg">
          <TableRow>
            <TableHead className="text-left px-3 py-2 font-medium text-text-secondary">মাস/বছর</TableHead>
            <TableHead className="text-right px-3 py-2 font-medium text-text-secondary">বকেয়া</TableHead>
            <TableHead className="text-right px-3 py-2 font-medium text-text-secondary">প্রযোজ্য</TableHead>
            <TableHead className="text-right px-3 py-2 font-medium text-text-secondary">বাকি</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dues.map((due) => {
            const balance = parseFloat(due.remaining_balance);
            const apply = Math.min(balance, remaining);
            const afterRemaining = balance - apply;
            sumAfterRemaining += afterRemaining;
            remaining -= apply;
            return (
              <TableRow key={due.public_id} className="border-t border-border">
                <TableCell className="px-3 py-2 text-text-primary">
                  {getMonthName(due.month)} {due.year}
                </TableCell>
                <TableCell className="px-3 py-2 text-right text-text-primary">
                  {formatCurrency(due.remaining_balance)}
                </TableCell>
                <TableCell className="px-3 py-2 text-right text-success font-medium">
                  {formatCurrency(apply)}
                </TableCell>
                <TableCell className="px-3 py-2 text-right text-text-secondary">
                  {formatCurrency(afterRemaining)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter className="bg-neutral-bg">
          <TableRow>
            <TableCell colSpan={2} className="px-3 py-2 font-medium text-text-primary">
              মোট
            </TableCell>
            <TableCell className="px-3 py-2 text-right font-medium text-success">
              {formatCurrency(totalAmount - remaining)}
            </TableCell>
            <TableCell className="px-3 py-2 text-right font-medium text-text-secondary">
              {sumAfterRemaining > 0 ? formatCurrency(sumAfterRemaining) : "৳০"}
            </TableCell>
          </TableRow>
          {remaining > 0 && (
          <TableRow>
            <TableCell colSpan={2} className="px-3 py-2 font-medium text-text-secondary">
              অব্যবহৃত
            </TableCell>
            <TableCell className="px-3 py-2 text-right text-text-secondary">
              {formatCurrency(remaining)}
            </TableCell>
            <TableCell></TableCell>
          </TableRow>
          )}
        </TableFooter>
      </Table>
    </div>
  );
}
