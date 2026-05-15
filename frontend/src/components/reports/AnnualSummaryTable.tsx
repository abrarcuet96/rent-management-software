import { getDashboardSummary } from "@/api/dashboard.api";
import PrintButton from "@/components/common/PrintButton";
import PrintHeader from "@/components/common/PrintHeader";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";

export default function AnnualSummaryTable() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [year, setYear] = useState(new Date().getFullYear());

  const { data, isLoading } = useQuery({
    queryKey: ["annual-summary", year],
    queryFn: () => getDashboardSummary({ year }),
  });

  const summary = data?.data.data;

  return (
    <div ref={contentRef}>
      <PrintHeader title="বার্ষিক সারসংক্ষেপ" />
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-primary">বার্ষিক সারসংক্ষেপ</h3>
        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="text-sm border border-border rounded-md px-2 py-1.5 bg-surface"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <PrintButton contentRef={contentRef} documentTitle="বার্ষিক সারসংক্ষেপ" />
        </div>
      </div>
      {isLoading ? (
        <p className="text-sm text-text-secondary text-center py-8">লোড হচ্ছে...</p>
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface rounded-xl p-4 border border-border">
            <p className="text-sm text-text-secondary">মোট সংগ্রহ</p>
            <p className="text-xl font-semibold text-success mt-1">
              {formatCurrency(summary.total_collected)}
            </p>
          </div>
          <div className="bg-surface rounded-xl p-4 border border-border">
            <p className="text-sm text-text-secondary">মোট ব্যয়</p>
            <p className="text-xl font-semibold text-danger mt-1">
              {formatCurrency(summary.total_expenses)}
            </p>
          </div>
          <div className="bg-surface rounded-xl p-4 border border-border">
            <p className="text-sm text-text-secondary">নিট লাভ</p>
            <p className="text-xl font-semibold text-text-primary mt-1">
              {formatCurrency(summary.net_profit)}
            </p>
          </div>
          <div className="bg-surface rounded-xl p-4 border border-border">
            <p className="text-sm text-text-secondary">বাকি</p>
            <p className="text-xl font-semibold text-warning mt-1">
              {formatCurrency(summary.total_outstanding)}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-text-secondary text-center py-8">কোনো ডেটা নেই</p>
      )}
    </div>
  );
}
