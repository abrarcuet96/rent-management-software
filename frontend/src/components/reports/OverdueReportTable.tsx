import { getOverdueList } from "@/api/reports.api";
import StatusBadge from "@/components/common/StatusBadge";
import PrintButton from "@/components/common/PrintButton";
import PrintHeader from "@/components/common/PrintHeader";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";

interface OverdueItem {
  due_public_id: string;
  month: number;
  year: number;
  due_date: string;
  remaining_balance: number;
  status: string;
  tenant_public_id: string;
  tenant_name: string;
  apartment_unit: string;
  building_name: string;
  days_overdue: number;
}

export default function OverdueReportTable() {
  const contentRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["overdue-list"],
    queryFn: () => getOverdueList(),
  });

  const items: OverdueItem[] = (data?.data.data as OverdueItem[]) ?? [];

  return (
    <div ref={contentRef}>
      <PrintHeader title="বকেয়া রিপোর্ট" />
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-primary">বকেয়া তালিকা</h3>
        <PrintButton contentRef={contentRef} documentTitle="বকেয়া রিপোর্ট" />
      </div>
      {isLoading ? (
        <p className="text-sm text-text-secondary text-center py-8">লোড হচ্ছে...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-text-secondary text-center py-8">কোনো বকেয়া নেই</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-bg">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-text-secondary">ভাড়াটে</th>
                <th className="text-left px-3 py-2 font-medium text-text-secondary">বিল্ডিং/ইউনিট</th>
                <th className="text-left px-3 py-2 font-medium text-text-secondary">মাস/বছর</th>
                <th className="text-right px-3 py-2 font-medium text-text-secondary">মোট দেয়</th>
                <th className="text-right px-3 py-2 font-medium text-text-secondary">বাকি</th>
                <th className="text-center px-3 py-2 font-medium text-text-secondary">দিন</th>
                <th className="text-center px-3 py-2 font-medium text-text-secondary">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.due_public_id} className="border-t border-border">
                  <td className="px-3 py-2 text-text-primary">{item.tenant_name}</td>
                  <td className="px-3 py-2 text-text-secondary">
                    {item.building_name} • {item.apartment_unit}
                  </td>
                  <td className="px-3 py-2 text-text-primary">
                    {item.month}/{item.year}
                  </td>
                  <td className="px-3 py-2 text-right text-text-primary">
                    {formatCurrency(item.remaining_balance)}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-danger">
                    {formatCurrency(item.remaining_balance)}
                  </td>
                  <td className="px-3 py-2 text-center text-text-secondary">
                    {item.days_overdue}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <StatusBadge status={item.status as "unpaid" | "partial"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
