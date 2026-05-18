import { getAnnualSummary } from "@/api/reports.api";
import EmptyState from "@/components/common/EmptyState";
import PrintButton from "@/components/common/PrintButton";
import PrintHeader from "@/components/common/PrintHeader";
import PrintFooter from "@/components/common/PrintFooter";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { useRef, useState } from "react";

export default function AnnualSummaryTable() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [year, setYear] = useState(new Date().getFullYear());

  const { data, isLoading } = useQuery({
    queryKey: ["annual-summary", year],
    queryFn: () => getAnnualSummary(year),
  });

  const summary = data?.data.data as {
    total_collected: number;
    total_expenses: number;
    net_profit: number;
    total_outstanding: number;
  } | undefined;

  return (
    <div ref={contentRef} data-print-document>
      <PrintHeader
        title="বার্ষিক সারসংক্ষেপ"
        meta={[
          { label: "বছর", value: String(year) },
          { label: "রিপোর্টের ধরন", value: "বার্ষিক আর্থিক সারসংক্ষেপ" },
        ]}
      />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-xl p-4 border border-border space-y-3">
              <Skeleton className="h-4 w-2/3 rounded" />
              <Skeleton className="h-7 w-1/2 rounded" />
            </div>
          ))}
        </div>
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
        <EmptyState
          title="কোনো ডেটা নেই"
          description="এই বছরের জন্য কোনো তথ্য পাওয়া যায়নি"
          icon={<BarChart3 size={40} />}
        />
      )}

      {/* Print-only formal table view of the summary */}
      {summary && (
        <div className="hidden print:block mt-4">
          <table>
            <thead>
              <tr>
                <th style={{ width: "60%" }}>বিবরণ</th>
                <th style={{ width: "40%", textAlign: "right" }}>পরিমাণ (৳)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>মোট সংগ্রহ</td>
                <td style={{ textAlign: "right" }}>{formatCurrency(summary.total_collected)}</td>
              </tr>
              <tr>
                <td>মোট ব্যয়</td>
                <td style={{ textAlign: "right" }}>{formatCurrency(summary.total_expenses)}</td>
              </tr>
              <tr>
                <td>বকেয়া</td>
                <td style={{ textAlign: "right" }}>{formatCurrency(summary.total_outstanding)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <th>নিট লাভ</th>
                <th style={{ textAlign: "right" }}>{formatCurrency(summary.net_profit)}</th>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <PrintFooter />
    </div>
  );
}
