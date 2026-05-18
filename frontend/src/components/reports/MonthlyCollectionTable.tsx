import { getDashboardSummary } from "@/api/dashboard.api";
import PrintButton from "@/components/common/PrintButton";
import PrintHeader from "@/components/common/PrintHeader";
import PrintFooter from "@/components/common/PrintFooter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <PrintButton contentRef={contentRef} documentTitle="মাসিক সংগ্রহ" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table className="text-sm">
          <TableHeader className="bg-neutral-bg">
            <TableRow>
              <TableHead className="text-left px-3 py-2 font-medium text-text-secondary">মাস</TableHead>
              <TableHead className="text-right px-3 py-2 font-medium text-text-secondary">সংগ্রহ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {months.map((m) => (
              <MonthRow key={m} month={m} year={year} />
            ))}
          </TableBody>
        </Table>
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
      <TableRow className="border-t border-border">
        <TableCell className="px-3 py-2 text-text-primary">{getMonthName(month)}</TableCell>
        <TableCell className="px-3 py-2 text-right text-text-secondary">...</TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow className="border-t border-border">
      <TableCell className="px-3 py-2 text-text-primary">{getMonthName(month)}</TableCell>
      <TableCell className="px-3 py-2 text-right font-medium text-success">
        {formatCurrency(collected)}
      </TableCell>
    </TableRow>
  );
}
