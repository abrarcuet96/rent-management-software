import { getOverdueList } from "@/api/reports.api";
import EmptyState from "@/components/common/EmptyState";
import TableSkeleton from "@/components/common/TableSkeleton";
import StatusBadge from "@/components/common/StatusBadge";
import PrintButton from "@/components/common/PrintButton";
import PrintHeader from "@/components/common/PrintHeader";
import PrintFooter from "@/components/common/PrintFooter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, toBn } from "@/lib/utils";
import { useFetchData } from "@/hooks/useFetchData";
import { CheckCircle2 } from "lucide-react";
import { useRef } from "react";

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

export default function OverdueReportTable() {
  const contentRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useFetchData({
    queryKey: ["overdue-list"],
    queryFn: () => getOverdueList(),
  });

  const items: OverdueItem[] = (data?.data.data as OverdueItem[]) ?? [];

  return (
    <div ref={contentRef} data-print-document>
      <PrintHeader
        title="বকেয়া রিপোর্ট"
        meta={[
          { label: "মোট বকেয়া", value: `${toBn(items.length)} টি` },
          { label: "স্ট্যাটাস", value: "সক্রিয় বকেয়া" },
        ]}
      />
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-primary">বকেয়া তালিকা</h3>
        <PrintButton contentRef={contentRef} documentTitle="বকেয়া রিপোর্ট" />
      </div>
      {isLoading ? (
        <TableSkeleton rows={5} cols={7} />
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
                <TableHead className="text-right px-3 py-2 font-medium text-text-secondary">প্রদান</TableHead>
                <TableHead className="text-right px-3 py-2 font-medium text-text-secondary">বাকি</TableHead>
                <TableHead className="text-center px-3 py-2 font-medium text-text-secondary">দিন</TableHead>
                <TableHead className="text-center px-3 py-2 font-medium text-text-secondary">স্ট্যাটাস</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.due_public_id} className="border-t border-border">
                  <TableCell className="px-3 py-2 text-text-primary">{item.tenant_name}</TableCell>
                  <TableCell className="px-3 py-2 text-text-secondary">
                    {item.building_name} • {item.apartment_unit}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-text-primary">
                    {toBn(item.month)}/{toBn(item.year)}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-right text-text-primary">
                    {formatCurrency(item.amount_paid)}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-right font-medium text-danger">
                    {formatCurrency(item.remaining_balance)}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-center text-text-secondary">
                    {toBn(item.days_overdue)}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-center">
                    <StatusBadge status={item.status as "unpaid" | "partial"} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <PrintFooter />
    </div>
  );
}
