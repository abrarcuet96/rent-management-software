import StatusBadge from "@/components/common/StatusBadge";
import type { Tenant } from "@/types";
import { ChevronRight, Phone, User } from "lucide-react";
import { Link } from "react-router-dom";

interface TenantCardProps {
  tenant: Tenant;
  buildingName?: string;
  unitNumber?: string;
}

export default function TenantCard({ tenant, buildingName, unitNumber }: TenantCardProps) {
  return (
    <Link
      to={`/tenants/${tenant.public_id}`}
      className="group block bg-surface rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow duration-200"
    >
      {/* Card body */}
      <div className="p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-success-bg flex items-center justify-center shrink-0">
          <User size={20} className="text-success" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-text-primary truncate leading-tight">
              {tenant.full_name}
            </h3>
            <div className="shrink-0">
              <StatusBadge status={tenant.is_active ? "active" : "moved_out"} />
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-text-secondary mt-1">
            <Phone size={12} className="shrink-0" />
            <span className="truncate">{tenant.phone}</span>
          </div>
          {buildingName && unitNumber && (
            <p className="text-xs text-text-secondary mt-1 truncate">
              {buildingName} • ইউনিট {unitNumber}
            </p>
          )}
        </div>
      </div>

      {/* Card footer */}
      <div className="border-t border-border px-4 py-2.5 bg-neutral-bg/40 flex items-center justify-between">
        <span className="text-xs text-text-secondary">
          যোগ: {new Date(tenant.move_in_date).toLocaleDateString("bn-BD")}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary group-hover:text-primary/80 transition-colors">
          বিস্তারিত
          <ChevronRight size={13} />
        </span>
      </div>
    </Link>
  );
}
