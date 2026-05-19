import { formatCurrency, getCssVar, getMonthName } from "@/lib/utils";
import type { DASHBOARD_SUMMARY } from "@/types";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface CollectionBarChartProps {
  summary: DASHBOARD_SUMMARY;
}

export default function CollectionBarChart({ summary }: CollectionBarChartProps) {
  const data = [
    {
      month: getMonthName(summary.month).slice(0, 3),
      collected: summary.total_collected,
      outstanding: summary.total_outstanding,
    },
  ];

  const borderColor = getCssVar("--color-border");
  const surface = getCssVar("--surface");
  const textPrimary = getCssVar("--text-primary");
  const textSecondary = getCssVar("--text-secondary");
  const chartCollected = getCssVar("--chart-collected");
  const chartOverdue = getCssVar("--chart-overdue");

  return (
    <div className="bg-surface rounded-xl p-5 border border-border">
      <h3 className="text-sm font-medium text-text-secondary mb-4">সংগ্রহ বিবরণ</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: textSecondary }} />
          <YAxis tick={{ fontSize: 12, fill: textSecondary }} tickFormatter={(v: number) => `৳${v}`} />
          <Tooltip
            formatter={(value: unknown) => formatCurrency(value as number)}
            contentStyle={{
              borderRadius: "8px",
              border: `1px solid ${borderColor}`,
              backgroundColor: surface,
              color: textPrimary,
            }}
            labelStyle={{ color: textPrimary }}
            itemStyle={{ color: textSecondary }}
          />
          <Bar dataKey="collected" fill={chartCollected} radius={[4, 4, 0, 0]} name="সংগৃহীত" />
          <Bar dataKey="outstanding" fill={chartOverdue} radius={[4, 4, 0, 0]} name="বাকি" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
