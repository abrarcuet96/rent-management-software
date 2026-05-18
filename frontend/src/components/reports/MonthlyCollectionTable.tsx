import { getDashboardSummary } from "@/api/dashboard.api";
import PrintButton from "@/components/common/PrintButton";
import PrintHeader from "@/components/common/PrintHeader";
import PrintFooter from "@/components/common/PrintFooter";
import { formatCurrency, getMonthName } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";

export default function MonthlyCollectionTable() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [year, setYear] = useState(new Date().getFullYear());

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div ref={contentRef} data-print-document>
      <PrintHeader
        title="মাসিক সংগ্রহ রিপোর্ট"
        meta={[
          { label: "বছর", value: String(year) },
          { label: "মোট মাস", value: "১২ মাস" },
        ]}
      />
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-primary">মাসিক সংগ্রহ</h3>
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
          <PrintButton contentRef={contentRef} documentTitle="মাসিক সংগ্রহ" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-bg">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-text-secondary">মাস</th>
              <th className="text-right px-3 py-2 font-medium text-text-secondary">সংগ্রহ</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m) => (
              <MonthRow key={m} month={m} year={year} />
            ))}
          </tbody>
        </table>
      </div>
      <PrintFooter />
    </div>
  );
}

function MonthRow({ month, year }: { month: number; year: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", month, year],
    queryFn: () => getDashboardSummary({ month, year }),
  });

  const collected = data?.data.data.total_collected ?? 0;

  if (isLoading) {
    return (
      <tr className="border-t border-border">
        <td className="px-3 py-2 text-text-primary">{getMonthName(month)}</td>
        <td className="px-3 py-2 text-right text-text-secondary">...</td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-border">
      <td className="px-3 py-2 text-text-primary">{getMonthName(month)}</td>
      <td className="px-3 py-2 text-right font-medium text-success">
        {formatCurrency(collected)}
      </td>
    </tr>
  );
}
