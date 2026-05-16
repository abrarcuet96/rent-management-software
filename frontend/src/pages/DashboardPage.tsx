import { getDashboardSummary } from "@/api/dashboard.api";
import CollectionBarChart from "@/components/dashboard/CollectionBarChart";
import OverdueTenantList from "@/components/dashboard/OverdueTenantList";
import PaymentStatusDonut from "@/components/dashboard/PaymentStatusDonut";
import StatCard from "@/components/common/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Building, Users } from "lucide-react";
import { useState } from "react";

export default function DashboardPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", month, year],
    queryFn: () => getDashboardSummary({ month, year }),
  });

  const summary = data?.data.data;

  return (
    <div className="space-y-6">
      {/* Month/Year selector */}
      <div className="flex items-center gap-3">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="text-sm border border-border rounded-md px-2 py-1.5 bg-surface"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"][m - 1]}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="text-sm border border-border rounded-md px-2 py-1.5 bg-surface"
        >
          {Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Stat cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface rounded-xl p-5 border border-border relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-neutral-bg" />
              <div className="pl-2 space-y-2">
                <Skeleton className="h-4 w-2/3 rounded" />
                <Skeleton className="h-8 w-1/2 rounded" />
                <Skeleton className="h-3 w-1/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="এই মাসে সংগৃহীত"
            value={summary ? formatCurrency(summary.total_collected) : "৳0"}
            subtitle="পেমেন্ট সংগ্রহ"
            icon={<ArrowUp size={20} />}
            colorClass="bg-success"
          />
          <StatCard
            title="মোট বাকি"
            value={summary ? formatCurrency(summary.total_outstanding) : "৳0"}
            subtitle="সকল বকেয়া"
            icon={<ArrowDown size={20} />}
            colorClass="bg-destructive"
          />
          <StatCard
            title="খালি অ্যাপার্টমেন্ট"
            value={summary?.vacant_apartments ?? 0}
            subtitle="মোট অ্যাপার্টমেন্ট"
            icon={<Building size={20} />}
            colorClass="bg-neutral"
          />
          <StatCard
            title="ভাড়াটে সংখ্যা"
            value={summary?.occupied_apartments ?? 0}
            subtitle="সক্রিয় ভাড়াটে"
            icon={<Users size={20} />}
            colorClass="bg-warning"
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isLoading ? (
          <>
            <div className="bg-surface rounded-xl p-5 border border-border space-y-3">
              <Skeleton className="h-4 w-1/3 rounded" />
              <Skeleton className="h-48 w-full rounded" />
            </div>
            <div className="bg-surface rounded-xl p-5 border border-border space-y-3">
              <Skeleton className="h-4 w-1/3 rounded" />
              <Skeleton className="h-48 w-full rounded" />
            </div>
          </>
        ) : (
          <>
            {summary && <CollectionBarChart summary={summary} />}
            <PaymentStatusDonut paid={0} partial={0} unpaid={0} />
          </>
        )}
      </div>

      {/* Overdue list */}
      <OverdueTenantList />
    </div>
  );
}
