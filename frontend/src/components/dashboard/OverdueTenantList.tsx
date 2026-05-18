import { getOverdueList } from "@/api/reports.api";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import TableSkeleton from "@/components/common/TableSkeleton";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CreditCard } from "lucide-react";
import { useState } from "react";
import RecordPayment from "@/components/payments/RecordPayment";

interface OverdueItem {
  due_public_id: string;
  month: number;
  year: number;
  due_date: string;
  rent_amount: number;
  total_due: number;
  amount_paid: number;
  remaining_balance: number;
  status: string;
  tenant_public_id: string;
  tenant_name: string;
  apartment_unit: string;
  building_name: string;
  agreement_public_id: string;
  days_overdue: number;
}

export default function OverdueTenantList() {
  const [payingDue, setPayingDue] = useState<OverdueItem | null>(null);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["overdue-list"],
    queryFn: () => getOverdueList(),
  });

  const items: OverdueItem[] = (data?.data.data as OverdueItem[]) ?? [];

  if (error) {
    return (
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-medium text-text-primary">বকেয়া ভাড়াটেদের তালিকা</h3>
        </div>
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-medium text-text-primary">বকেয়া ভাড়াটেদের তালিকা</h3>
      </div>

      {isLoading ? (
        <TableSkeleton rows={4} cols={7} />
      ) : items.length === 0 ? (
        <EmptyState
          title="কোনো বকেয়া নেই"
          description="সকল পেমেন্ট সময়মতো পরিশোধিত হয়েছে"
          icon={<CheckCircle2 size={40} className="text-success" />}
        />
      ) : (
      <div className="overflow-x-auto">
        <Table className="text-sm">
          <TableHeader className="bg-neutral-bg">
            <TableRow>
              <TableHead className="text-left px-3 py-2 font-medium text-text-secondary">ভাড়াটে</TableHead>
              <TableHead className="text-left px-3 py-2 font-medium text-text-secondary">বিল্ডিং/ইউনিট</TableHead>
              <TableHead className="text-left px-3 py-2 font-medium text-text-secondary">মাস/বছর</TableHead>
              <TableHead className="text-right px-3 py-2 font-medium text-text-secondary">বাকি</TableHead>
              <TableHead className="text-center px-3 py-2 font-medium text-text-secondary">বকেয়া দিন</TableHead>
              <TableHead className="text-center px-3 py-2 font-medium text-text-secondary">স্ট্যাটাস</TableHead>
              <TableHead className="text-right px-3 py-2 font-medium text-text-secondary">অ্যাকশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.due_public_id} className="border-t border-border hover:bg-neutral-bg">
                <TableCell className="px-3 py-2 text-text-primary">{item.tenant_name}</TableCell>
                <TableCell className="px-3 py-2 text-text-secondary">
                  {item.building_name} • {item.apartment_unit}
                </TableCell>
                <TableCell className="px-3 py-2 text-text-primary">
                  {item.month}/{item.year}
                </TableCell>
                <TableCell className="px-3 py-2 text-right font-medium text-danger">
                  {formatCurrency(item.remaining_balance)}
                </TableCell>
                <TableCell className="px-3 py-2 text-center text-text-secondary">
                  {item.days_overdue > 0 ? (
                    <span className="text-danger font-medium">{item.days_overdue}</span>
                  ) : item.days_overdue < 0 ? (
                    <span className="text-text-muted text-xs">আসছে</span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="px-3 py-2 text-center">
                  <StatusBadge status={item.status as "unpaid" | "partial"} />
                </TableCell>
                <TableCell className="px-3 py-2 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setPayingDue(item)}
                  >
                    <CreditCard size={13} className="mr-1" />
                    পরিশোধ
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      )}

      {payingDue && (
        <RecordPayment
          open={!!payingDue}
          onOpenChange={(open) => {
            if (!open) setPayingDue(null);
          }}
          due={{
            public_id: payingDue.due_public_id,
            tenant_public_id: payingDue.tenant_public_id,
            agreement_public_id: payingDue.agreement_public_id,
            month: payingDue.month,
            year: payingDue.year,
            rent_amount: String(payingDue.rent_amount),
            total_due: String(payingDue.total_due),
            amount_paid: String(payingDue.amount_paid),
            remaining_balance: String(payingDue.remaining_balance),
            status: payingDue.status as "unpaid" | "partial" | "paid",
            is_auto_generated: true,
            due_date: payingDue.due_date,
            created_at: "",
          }}
          tenantId={payingDue.tenant_public_id}
        />
      )}
    </div>
  );
}
