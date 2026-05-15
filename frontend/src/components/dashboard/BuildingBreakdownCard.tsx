import { formatCurrency } from "@/lib/utils";

interface BuildingBreakdownCardProps {
  name: string;
  collected: number;
  outstanding: number;
  apartments: number;
}

export default function BuildingBreakdownCard({ name, collected, outstanding, apartments }: BuildingBreakdownCardProps) {
  return (
    <div className="bg-surface rounded-xl p-4 border border-border">
      <h4 className="font-medium text-text-primary mb-2">{name}</h4>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-text-secondary">সংগৃহীত</span>
          <span className="text-success font-medium">{formatCurrency(collected)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">বাকি</span>
          <span className="text-danger font-medium">{formatCurrency(outstanding)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">অ্যাপার্টমেন্ট</span>
          <span className="text-text-primary font-medium">{apartments}</span>
        </div>
      </div>
    </div>
  );
}
