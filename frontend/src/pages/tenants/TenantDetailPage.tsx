import { getTenantById } from "@/api/tenants.api";
import { getDues } from "@/api/dues.api";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import PrintButton from "@/components/common/PrintButton";
import StatusBadge from "@/components/common/StatusBadge";
import { formatCurrency, getMonthName } from "@/lib/utils";
import { useNavigationStore } from "@/stores/navigationStore";
import type { MonthlyDue } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Phone, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

export default function TenantDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const contentRef = useRef<HTMLDivElement>(null);
  const [expandedDue, setExpandedDue] = useState<string | null>(null);
  const { setActiveTenant } = useNavigationStore();

  const { data: tenantData, isLoading: tenantLoading, error: tenantError, refetch: refetchTenant } = useQuery({
    queryKey: ["tenants", tenantId],
    queryFn: () => getTenantById(tenantId!),
    enabled: !!tenantId,
  });

  const tenant = tenantData?.data.data;

  useEffect(() => {
    if (tenant) setActiveTenant(tenantId ?? null, tenant.full_name);
    return () => setActiveTenant(null);
  }, [tenant, tenantId, setActiveTenant]);

  const { data: duesData, isLoading: duesLoading } = useQuery({
    queryKey: ["dues", tenantId],
    queryFn: () => getDues(tenantId!, { page: 1, page_size: 100 }),
    enabled: !!tenantId,
  });

  const dues: MonthlyDue[] = duesData?.data.data ?? [];

  // Calculate totals
  const totalPaid = dues.reduce((sum, d) => sum + d.amount_paid, 0);
  const totalOutstanding = dues.reduce((sum, d) => sum + d.remaining_balance, 0);

  if (tenantLoading) {
    return <LoadingSpinner />;
  }

  if (tenantError || !tenant) {
    return <ErrorState onRetry={() => refetchTenant()} />;
  }

  return (
    <div ref={contentRef} className="space-y-6">
      <PrintButton contentRef={contentRef} documentTitle={tenant.full_name} />

      {/* Tenant info */}
      <div className="bg-surface rounded-xl p-5 border border-border">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-success-bg flex items-center justify-center">
              <User size={24} className="text-success" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">{tenant.full_name}</h2>
              <div className="flex items-center gap-1 text-sm text-text-secondary mt-0.5">
                <Phone size={14} />
                {tenant.phone}
              </div>
            </div>
          </div>
          <StatusBadge status={tenant.is_active ? "active" : "moved_out"} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-text-secondary">এনআইডি</p>
            <p className="text-sm text-text-primary mt-0.5">{tenant.nid_number ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">ঠিকানা</p>
            <p className="text-sm text-text-primary mt-0.5">{tenant.address ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">পরিবার</p>
            <p className="text-sm text-text-primary mt-0.5">{tenant.member_count} জন</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">প্রবেশের তারিখ</p>
            <p className="text-sm text-text-primary mt-0.5">{tenant.move_in_date}</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl p-4 border border-border">
          <p className="text-sm text-text-secondary">মোট পরিশোধিত</p>
          <p className="text-xl font-semibold text-success mt-1">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-surface rounded-xl p-4 border border-border">
          <p className="text-sm text-text-secondary">মোট বাকি</p>
          <p className="text-xl font-semibold text-danger mt-1">{formatCurrency(totalOutstanding)}</p>
        </div>
        <div className="bg-surface rounded-xl p-4 border border-border">
          <p className="text-sm text-text-secondary">মোট ডিউ</p>
          <p className="text-xl font-semibold text-text-primary mt-1">{dues.length}</p>
        </div>
      </div>

      {/* Ledger */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-medium text-text-primary">লেজার</h3>
        </div>
        {duesLoading ? (
          <div className="p-4 text-center text-sm text-text-secondary">লোড হচ্ছে...</div>
        ) : dues.length === 0 ? (
          <EmptyState title="কোনো ডিউ নেই" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-bg">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-text-secondary">মাস/বছর</th>
                  <th className="text-right px-3 py-2 font-medium text-text-secondary">মোট দেয়</th>
                  <th className="text-right px-3 py-2 font-medium text-text-secondary">পরিশোধিত</th>
                  <th className="text-right px-3 py-2 font-medium text-text-secondary">বাকি</th>
                  <th className="text-center px-3 py-2 font-medium text-text-secondary">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody>
                {dues.map((due) => (
                  <tr
                    key={due.public_id}
                    className="border-t border-border hover:bg-neutral-bg cursor-pointer"
                    onClick={() => setExpandedDue(expandedDue === due.public_id ? null : due.public_id)}
                  >
                    <td className="px-3 py-3 text-text-primary">
                      {getMonthName(due.month)} {due.year}
                    </td>
                    <td className="px-3 py-3 text-right text-text-primary">
                      {formatCurrency(due.total_due)}
                    </td>
                    <td className="px-3 py-3 text-right text-success">
                      {formatCurrency(due.amount_paid)}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-text-primary">
                      {formatCurrency(due.remaining_balance)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <StatusBadge status={due.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
