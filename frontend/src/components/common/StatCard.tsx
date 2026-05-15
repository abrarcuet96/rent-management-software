import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  colorClass?: string;
}

export default function StatCard({ title, value, subtitle, icon, colorClass }: StatCardProps) {
  return (
    <div className="bg-surface rounded-xl p-5 shadow-sm border border-border relative overflow-hidden">
      {colorClass && <div className={cn("absolute left-0 top-0 bottom-0 w-1", colorClass)} />}
      <div className={cn("flex items-start justify-between gap-2", colorClass && "pl-2")}>
        <div>
          <p className="text-sm text-text-secondary font-normal">{title}</p>
          <p className="text-2xl md:text-3xl font-semibold text-text-primary mt-1">{value}</p>
          {subtitle && <p className="text-xs text-text-secondary mt-1">{subtitle}</p>}
        </div>
        {icon && <div className="text-text-secondary shrink-0">{icon}</div>}
      </div>
    </div>
  );
}
