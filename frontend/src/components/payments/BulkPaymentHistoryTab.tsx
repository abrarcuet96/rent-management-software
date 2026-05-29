import { getBulkPaymentHistory } from "@/api/payments.api";
import StatusBadge from "@/components/common/StatusBadge";
import EmptyState from "@/components/common/EmptyState";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency, formatDate, getMonthName, toBn } from "@/lib/utils";
import type { BULK_PAYMENT_HISTORY_ITEM } from "@/types";
import { useFetchData } from "@/hooks/useFetchData";
import { ChevronDown, ChevronRight, Receipt } from "lucide-react";
import { useState } from "react";

export default function BulkPaymentHistoryTab() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const { data, isLoading } = useFetchData({
    queryKey: ["bulk-payment-history", page],
    queryFn: () => getBulkPaymentHistory({ page, page_size: 20 }),
  });

  const items: BULK_PAYMENT_HISTORY_ITEM[] = (data?.data.data ?? []) as BULK_PAYMENT_HISTORY_ITEM[];
  const total = data?.data.pagination?.total ?? 0;

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-text-primary mb-4">
        বাল্ক পেমেন্ট ইতিহাস
      </h3>

      {isLoading ? (
        <LoadingSpinner size="md" className="py-10" />
      ) : items.length === 0 ? (
        <EmptyState
          title="কোনো বাল্ক পেমেন্ট রেকর্ড নেই"
          description="এখনো কোনো বাল্ক পেমেন্ট করা হয়নি"
          icon={<Receipt size={40} />}
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const key = `${item.paid_on}-${item.tenant_public_id}`;
            const isExpanded = expanded.has(key);
            return (
              <div
                key={key}
                className="bg-surface rounded-lg border border-border overflow-hidden"
              >
                <Button
                  variant="ghost"
                  onClick={() => toggle(key)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-bg h-auto rounded-none justify-between text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isExpanded ? (
                      <ChevronDown size={16} className="text-text-secondary shrink-0" />
                    ) : (
                      <ChevronRight size={16} className="text-text-secondary shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {item.tenant_name}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {formatDate(item.paid_on)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm shrink-0">
                    <span className="text-text-secondary">
                      {toBn(item.dues.length)}টি ডিউ
                    </span>
                    <span className="font-semibold text-success">
                      {formatCurrency(item.total_amount)}
                    </span>
                    {item.note && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs text-text-secondary max-w-32 truncate cursor-help">
                              {item.note}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{item.note}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </Button>

                {isExpanded && (
                  <div className="border-t border-border">
                    <Table className="text-xs">
                      <TableHeader>
                        <TableRow className="border-b border-border bg-neutral-bg">
                          <TableHead className="text-left px-4 py-2 font-medium text-text-secondary">
                            মাস/বছর
                          </TableHead>
                          <TableHead className="text-right px-4 py-2 font-medium text-text-secondary">
                            পরিশোধিত
                          </TableHead>
                          <TableHead className="text-center px-4 py-2 font-medium text-text-secondary">
                            স্ট্যাটাস
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {item.dues.map((due) => (
                          <TableRow
                            key={due.due_public_id}
                            className="border-b border-border/50 hover:bg-neutral-bg"
                          >
                            <TableCell className="px-4 py-2 text-text-primary">
                              {getMonthName(due.month)} {toBn(due.year)}
                            </TableCell>
                            <TableCell className="px-4 py-2 text-right text-success font-medium">
                              {formatCurrency(due.amount_applied)}
                            </TableCell>
                            <TableCell className="px-4 py-2 text-center">
                              <StatusBadge status={due.new_status as "paid" | "partial"} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            );
          })}

          {total > 20 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                পূর্ববর্তী
              </Button>
              <span className="px-3 py-1.5 text-sm text-text-secondary">
                পৃষ্ঠা {toBn(page)} / {toBn(Math.ceil(total / 20))}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(total / 20)}
              >
                পরবর্তী
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
