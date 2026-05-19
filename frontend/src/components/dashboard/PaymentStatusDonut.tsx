import { getCssVar, toBn } from "@/lib/utils";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface PaymentStatusDonutProps {
  paid: number;
  partial: number;
  unpaid: number;
}

const LABELS = ["পরিশোধিত", "আংশিক", "বকেয়া"];

export default function PaymentStatusDonut({ paid, partial, unpaid }: PaymentStatusDonutProps) {
  const borderColor = getCssVar("--color-border");
  const surface = getCssVar("--surface");
  const textPrimary = getCssVar("--text-primary");
  const textSecondary = getCssVar("--text-secondary");
  const COLORS = [
    getCssVar("--chart-collected"),
    getCssVar("--chart-partial"),
    getCssVar("--chart-overdue"),
  ];

  const data = [
    { name: LABELS[0], value: paid },
    { name: LABELS[1], value: partial },
    { name: LABELS[2], value: unpaid },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="bg-surface rounded-xl p-5 border border-border flex items-center justify-center h-[200px]">
        <p className="text-sm text-text-secondary">কোনো ডেটা নেই</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl p-5 border border-border">
      <h3 className="text-sm font-medium text-text-secondary mb-4">পেমেন্ট অবস্থা</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: unknown, name: unknown) => [`${toBn(value as number)} টি`, name as string]}
            contentStyle={{
              borderRadius: "8px",
              border: `1px solid ${borderColor}`,
              backgroundColor: surface,
              color: textPrimary,
            }}
            labelStyle={{ color: textPrimary }}
            itemStyle={{ color: textSecondary }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 mt-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
            <span className="text-xs text-text-secondary">{d.name} ({toBn(d.value)})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
