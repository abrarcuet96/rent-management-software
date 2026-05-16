import { getPaymentHistory } from "@/api/reports.api";
import { getTenants } from "@/api/tenants.api";
import EmptyState from "@/components/common/EmptyState";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import StatusBadge from "@/components/common/StatusBadge";
import PrintButton from "@/components/common/PrintButton";
import PrintHeader from "@/components/common/PrintHeader";
import { formatCurrency, getMonthName } from "@/lib/utils";
import type { Tenant } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Receipt } from "lucide-react";
import { useState, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaymentHistoryItem {
  due_public_id: string;
  month: number;
  year: number;
  rent_amount: number;
  total_due: number;
  amount_paid: number;
  remaining_balance: number;
  status: string;
  due_date: string | null;
  payments: {
    public_id: string;
    amount_paid: number;
    paid_on: string;
    note: string | null;
  }[];
}

export default function PaymentHistoryReport() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");

  const { data: tenantsData } = useQuery({
    queryKey: ["tenants", "all", "report"],
    queryFn: () => getTenants({ page: 1, page_size: 100 }),
  });

  const tenants: Tenant[] = (tenantsData?.data.data ?? []) as Tenant[];

  const { data, isLoading } = useQuery({
    queryKey: ["payment-history", selectedTenantId],
    queryFn: () => getPaymentHistory({ tenant_public_id: selectedTenantId, page: 1, page_size: 100 }),
    enabled: !!selectedTenantId,
  });

  const items: PaymentHistoryItem[] = (data?.data.data ?? []) as PaymentHistoryItem[];

  return (
    <div ref={contentRef}>
      <PrintHeader title="পেমেন্ট ইতিহাস" />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-text-primary">পেমেন্ট ইতিহাস</h3>
          <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="ভাড়াটে বেছে নিন" />
            </SelectTrigger>
            <SelectContent>
              {tenants.map((t) => (
                <SelectItem key={t.public_id} value={t.public_id}>
                  {t.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <PrintButton
          contentRef={contentRef}
          documentTitle="পেমেন্ট ইতিহাস"
        />
      </div>

      {!selectedTenantId ? (
        <EmptyState
          title="ভাড়াটে নির্বাচন করুন"
          description="পেমেন্ট ইতিহাস দেখতে উপরের ড্রপডাউন থেকে একজন ভাড়াটে বেছে নিন"
          icon={<CreditCard size={40} />}
        />
      ) : isLoading ? (
        <LoadingSpinner size="md" className="py-10" />
      ) : items.length === 0 ? (
        <EmptyState
          title="কোনো পেমেন্ট রেকর্ড নেই"
          description="এই ভাড়াটের কোনো পেমেন্ট এখনো রেকর্ড করা হয়নি"
          icon={<Receipt size={40} />}
        />
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.due_public_id}
              className="bg-surface rounded-lg border border-border overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 bg-neutral-bg">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-text-primary">
                    {getMonthName(item.month)} {item.year}
                  </span>
                  <StatusBadge status={item.status as "paid" | "partial" | "unpaid"} />
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-text-secondary">
                    মোট দেয়:{" "}
                    <span className="text-text-primary font-medium">
                      {formatCurrency(item.total_due)}
                    </span>
                  </span>
                  <span className="text-text-secondary">
                    পরিশোধিত:{" "}
                    <span className="text-success font-medium">
                      {formatCurrency(item.amount_paid)}
                    </span>
                  </span>
                  <span className="text-text-secondary">
                    বাকি:{" "}
                    <span className="text-danger font-medium">
                      {formatCurrency(item.remaining_balance)}
                    </span>
                  </span>
                </div>
              </div>

              {item.payments.length > 0 && (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-1.5 font-medium text-text-secondary">
                        তারিখ
                      </th>
                      <th className="text-right px-4 py-1.5 font-medium text-text-secondary">
                        পরিমাণ
                      </th>
                      <th className="text-left px-4 py-1.5 font-medium text-text-secondary">
                        নোট
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.payments.map((p) => (
                      <tr key={p.public_id} className="border-b border-border/50">
                        <td className="px-4 py-2 text-text-primary">
                          {p.paid_on}
                        </td>
                        <td className="px-4 py-2 text-right text-success font-medium">
                          {formatCurrency(p.amount_paid)}
                        </td>
                        <td className="px-4 py-2 text-text-secondary">
                          {p.note ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {item.payments.length === 0 && (
                <p className="px-4 py-3 text-xs text-text-secondary">
                  কোনো পেমেন্ট নেই
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
