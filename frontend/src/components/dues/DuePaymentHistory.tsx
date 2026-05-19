import { getPayments } from "@/api/payments.api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, toBn } from "@/lib/utils";
import type { PAYMENT_RECORD } from "@/types";
import { useFetchData } from "@/hooks/useFetchData";
import { Loader2 } from "lucide-react";

interface DuePaymentHistoryProps {
  dueId: string;
}

export default function DuePaymentHistory({ dueId }: DuePaymentHistoryProps) {
  const { data, isLoading } = useFetchData({
    queryKey: ["payments", dueId],
    queryFn: () => getPayments(dueId),
    enabled: !!dueId,
  });

  const payments: PAYMENT_RECORD[] = data?.data.data ?? [];

  if (isLoading) {
    return (
      <div className="px-3 py-4 text-center">
        <Loader2 size={16} className="animate-spin inline-block text-text-secondary" />
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="px-3 py-4 text-center text-sm text-text-secondary">
        কোনো পেমেন্ট রেকর্ড নেই
      </div>
    );
  }

  return (
    <div className="bg-neutral-bg/60 border-t border-border px-4 py-3">
      <p className="text-xs font-semibold text-text-secondary mb-2.5">
        পেমেন্ট ইতিহাস ({toBn(payments.length)})
      </p>
      <div className="rounded-lg border border-border overflow-hidden print:overflow-visible bg-surface">
        <Table className="text-xs">
          <TableHeader>
            <TableRow className="border-b border-border bg-neutral-bg">
              <TableHead className="text-left px-3 py-2 font-medium text-text-secondary whitespace-nowrap">তারিখ</TableHead>
              <TableHead className="text-right px-3 py-2 font-medium text-text-secondary whitespace-nowrap">পরিমাণ</TableHead>
              <TableHead className="text-left px-3 py-2 font-medium text-text-secondary">নোট</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.public_id} className="border-b border-border/50 last:border-0">
                <TableCell className="px-3 py-2 text-text-primary whitespace-nowrap">{p.paid_on}</TableCell>
                <TableCell className="px-3 py-2 text-right text-success font-medium whitespace-nowrap">
                  {formatCurrency(p.amount_paid)}
                </TableCell>
                <TableCell className="px-3 py-2 text-text-secondary">{p.note ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
