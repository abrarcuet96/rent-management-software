import { getPayments } from "@/api/payments.api";
import { formatCurrency } from "@/lib/utils";
import type { PaymentRecord } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface DuePaymentHistoryProps {
  dueId: string;
}

export default function DuePaymentHistory({ dueId }: DuePaymentHistoryProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["payments", dueId],
    queryFn: () => getPayments(dueId),
    enabled: !!dueId,
  });

  const payments: PaymentRecord[] = data?.data.data ?? [];

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
        পেমেন্ট ইতিহাস ({payments.length})
      </p>
      <div className="rounded-lg border border-border overflow-hidden print:overflow-visible bg-surface">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-neutral-bg">
              <th className="text-left px-3 py-2 font-medium text-text-secondary whitespace-nowrap">তারিখ</th>
              <th className="text-right px-3 py-2 font-medium text-text-secondary whitespace-nowrap">পরিমাণ</th>
              <th className="text-left px-3 py-2 font-medium text-text-secondary">নোট</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.public_id} className="border-b border-border/50 last:border-0">
                <td className="px-3 py-2 text-text-primary whitespace-nowrap">{p.paid_on}</td>
                <td className="px-3 py-2 text-right text-success font-medium whitespace-nowrap">
                  {formatCurrency(p.amount_paid)}
                </td>
                <td className="px-3 py-2 text-text-secondary">{p.note ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
