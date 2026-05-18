import { getDues } from "@/api/dues.api";
import { getTenantById } from "@/api/tenants.api";
import AgreementList from "@/components/agreements/AgreementList";
import BulkRentAdjustDialog from "@/components/agreements/BulkRentAdjustDialog";
import CreateAgreementDialog from "@/components/agreements/CreateAgreementDialog";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import ExpandCollapseButton from "@/components/common/ExpandCollapseButton";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import PrintButton from "@/components/common/PrintButton";
import StatusBadge from "@/components/common/StatusBadge";
import TableSkeleton from "@/components/common/TableSkeleton";
import AdjustDueDialog from "@/components/dues/AdjustDueDialog";
import GenerateMonthlyDue from "@/components/payments/GenerateMonthlyDue";
import MonthlyDueRow from "@/components/payments/MonthlyDueRow";
import RecordPayment from "@/components/payments/RecordPayment";
import EditTenantInfo from "@/components/tenants/EditTenantInfo";
import MoveOutTenant from "@/components/tenants/MoveOutTenant";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { useNavigationStore } from "@/stores/navigationStore";
import type { MonthlyDue } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Edit2, FileText, LogOut, Phone, Plus, User } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";

export default function TenantDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const contentRef = useRef<HTMLDivElement>(null);
  const duesInitialized = useRef(false);
  const { setActiveTenant } = useNavigationStore();

  // Dialog state
  const [editTenantOpen, setEditTenantOpen] = useState(false);
  const [moveOutOpen, setMoveOutOpen] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [bulkRentOpen, setBulkRentOpen] = useState(false);
  const [generateDueOpen, setGenerateDueOpen] = useState(false);
  const [payingDue, setPayingDue] = useState<MonthlyDue | null>(null);
  const [adjustingDue, setAdjustingDue] = useState<MonthlyDue | null>(null);

  // Expand/collapse
  const [expandedDues, setExpandedDues] = useState<Set<string>>(new Set());

  const {
    data: tenantData,
    isLoading: tenantLoading,
    error: tenantError,
    refetch: refetchTenant,
  } = useQuery({
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

  const dues = useMemo<MonthlyDue[]>(
    () => duesData?.data.data ?? [],
    [duesData],
  );

  const totalPaid = dues.reduce(
    (sum, d) => sum + parseFloat(d.amount_paid || "0"),
    0,
  );
  const totalOutstanding = dues.reduce(
    (sum, d) => sum + parseFloat(d.remaining_balance || "0"),
    0,
  );

  // Expand all by default on first load
  useEffect(() => {
    if (dues.length > 0 && !duesInitialized.current) {
      setExpandedDues(new Set(dues.map((d) => d.public_id)));
      duesInitialized.current = true;
    }
  }, [dues]);

  const allDuesExpanded =
    dues.length > 0 && dues.every((d) => expandedDues.has(d.public_id));

  const toggleDue = (id: string) =>
    setExpandedDues((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const expandAllDues = () =>
    setExpandedDues(new Set(dues.map((d) => d.public_id)));
  const collapseAllDues = () => setExpandedDues(new Set());

  if (tenantLoading) return <LoadingSpinner />;
  if (tenantError || !tenant)
    return <ErrorState onRetry={() => refetchTenant()} />;

  return (
    <div ref={contentRef} className="space-y-6">
      <div className="flex print:hidden">
        <PrintButton contentRef={contentRef} documentTitle={tenant.full_name} />
      </div>

      {/* Tenant info card */}
      <div className="bg-surface rounded-xl p-5 border border-border">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-success-bg flex items-center justify-center shrink-0">
              <User size={24} className="text-success" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                {tenant.full_name}
              </h2>
              <div className="flex items-center gap-1 text-sm text-text-secondary mt-0.5">
                <Phone size={14} />
                {tenant.phone}
              </div>
              {tenant.building_name && (
                <p className="text-xs text-text-secondary mt-0.5">
                  {tenant.building_name} • ইউনিট {tenant.apartment_unit_number}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={tenant.is_active ? "active" : "moved_out"} />
            {tenant.is_active && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditTenantOpen(true)}
                >
                  <Edit2 size={14} className="mr-1" />
                  সম্পাদনা
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-danger border-danger hover:bg-danger-bg"
                  onClick={() => setMoveOutOpen(true)}
                >
                  <LogOut size={14} className="mr-1" />
                  চলে গেছে
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-text-secondary">এনআইডি</p>
            <p className="text-sm text-text-primary mt-0.5">
              {tenant.nid_number ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">ঠিকানা</p>
            <p className="text-sm text-text-primary mt-0.5">
              {tenant.address ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">পরিবার</p>
            <p className="text-sm text-text-primary mt-0.5">
              {tenant.member_count} জন
            </p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">প্রবেশের তারিখ</p>
            <p className="text-sm text-text-primary mt-0.5">
              {tenant.move_in_date}
            </p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl p-4 border border-border min-w-0">
          <p className="text-sm text-text-secondary">মোট পরিশোধিত</p>
          <p className="text-xl font-semibold text-success mt-1 truncate">
            {formatCurrency(totalPaid)}
          </p>
        </div>
        <div className="bg-surface rounded-xl p-4 border border-border min-w-0">
          <p className="text-sm text-text-secondary">মোট বাকি</p>
          <p className="text-xl font-semibold text-danger mt-1 truncate">
            {formatCurrency(totalOutstanding)}
          </p>
        </div>
        <div className="bg-surface rounded-xl p-4 border border-border min-w-0">
          <p className="text-sm text-text-secondary">ডিউ সংখ্যা</p>
          <p className="text-xl font-semibold text-text-primary mt-1">
            {
              dues.filter(
                (d) => d.status === "unpaid" || d.status === "partial",
              ).length
            }
          </p>
        </div>
      </div>

      {/* Agreements */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
            <FileText size={16} />
            চুক্তিসমূহ
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkRentOpen(true)}
            >
              বাল্ক ভাড়া
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAgreementOpen(true)}
            >
              <Plus size={14} className="mr-1" />
              নতুন চুক্তি
            </Button>
          </div>
        </div>
        <AgreementList tenantId={tenantId!} />
      </div>

      {/* Dues / Ledger */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-text-primary">মাসিক ডিউ</h3>
            {dues.length > 0 && (
              <ExpandCollapseButton
                allExpanded={allDuesExpanded}
                onExpandAll={expandAllDues}
                onCollapseAll={collapseAllDues}
              />
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setGenerateDueOpen(true)}
          >
            <Plus size={14} className="mr-1" />
            ডিউ তৈরি
          </Button>
        </div>

        {duesLoading ? (
          <TableSkeleton rows={4} cols={6} />
        ) : dues.length === 0 ? (
          <EmptyState
            title="কোনো ডিউ নেই"
            description="ডিউ তৈরি করতে উপরের বাটনে ক্লিক করুন"
          />
        ) : (
          <div className="overflow-x-auto print:overflow-visible">
            <Table className="min-w-[560px] print:min-w-0 text-sm">
              <TableHeader className="bg-neutral-bg">
                <TableRow>
                  <TableHead className="text-left px-3 py-2 font-medium text-text-secondary whitespace-nowrap">
                    মাস/বছর
                  </TableHead>
                  <TableHead className="text-right px-3 py-2 font-medium text-text-secondary whitespace-nowrap">
                    মোট দেয়
                  </TableHead>
                  <TableHead className="text-right px-3 py-2 font-medium text-text-secondary whitespace-nowrap">
                    পরিশোধিত
                  </TableHead>
                  <TableHead className="text-right px-3 py-2 font-medium text-text-secondary whitespace-nowrap">
                    বাকি
                  </TableHead>
                  <TableHead className="text-center px-3 py-2 font-medium text-text-secondary whitespace-nowrap">
                    স্ট্যাটাস
                  </TableHead>
                  <TableHead className="text-right px-3 py-2 font-medium text-text-secondary whitespace-nowrap print:hidden">
                    অ্যাকশন
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dues.map((due) => (
                  <MonthlyDueRow
                    key={due.public_id}
                    due={due}
                    onPay={() => setPayingDue(due)}
                    onAdjust={() => setAdjustingDue(due)}
                    expanded={expandedDues.has(due.public_id)}
                    onToggle={() => toggleDue(due.public_id)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {tenant.is_active && (
        <>
          <EditTenantInfo
            open={editTenantOpen}
            onOpenChange={setEditTenantOpen}
            apartmentId={tenant.apartment_public_id}
            tenant={tenant}
          />
          <MoveOutTenant
            open={moveOutOpen}
            onOpenChange={setMoveOutOpen}
            apartmentId={tenant.apartment_public_id}
            tenant={tenant}
          />
        </>
      )}
      <CreateAgreementDialog
        open={agreementOpen}
        onOpenChange={setAgreementOpen}
        tenantId={tenantId!}
      />
      <BulkRentAdjustDialog
        open={bulkRentOpen}
        onOpenChange={setBulkRentOpen}
      />
      <GenerateMonthlyDue
        open={generateDueOpen}
        onOpenChange={setGenerateDueOpen}
        tenantId={tenantId!}
      />
      {payingDue && (
        <RecordPayment
          open={!!payingDue}
          onOpenChange={(open) => {
            if (!open) setPayingDue(null);
          }}
          due={payingDue}
          tenantId={tenantId!}
        />
      )}
      {adjustingDue && (
        <AdjustDueDialog
          open={!!adjustingDue}
          onOpenChange={(open) => {
            if (!open) setAdjustingDue(null);
          }}
          due={adjustingDue}
          tenantId={tenantId!}
        />
      )}
    </div>
  );
}
