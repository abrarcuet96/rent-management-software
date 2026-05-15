import { getApartmentById } from "@/api/apartments.api";
import { getBuildingById } from "@/api/buildings.api";
import { getDues } from "@/api/dues.api";
import { getActiveTenant } from "@/api/tenants.api";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import PrintButton from "@/components/common/PrintButton";
import StatusBadge from "@/components/common/StatusBadge";
import AssignTenant from "@/components/tenants/AssignTenant";
import EditTenantInfo from "@/components/tenants/EditTenantInfo";
import MoveOutTenant from "@/components/tenants/MoveOutTenant";
import GenerateMonthlyDue from "@/components/payments/GenerateMonthlyDue";
import MonthlyDueRow from "@/components/payments/MonthlyDueRow";
import RecordPayment from "@/components/payments/RecordPayment";
import { Button } from "@/components/ui/button";
import { useNavigationStore } from "@/stores/navigationStore";
import type { MonthlyDue, Tenant } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { DoorOpen, Edit2, LogOut, Plus, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

export default function ApartmentDetailPage() {
  const { buildingId, apartmentId } = useParams<{ buildingId: string; apartmentId: string }>();
  const [assignOpen, setAssignOpen] = useState(false);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [moveOutOpen, setMoveOutOpen] = useState(false);
  const [generateDueOpen, setGenerateDueOpen] = useState(false);
  const [payingDue, setPayingDue] = useState<MonthlyDue | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { setActiveBuilding, setActiveApartment } = useNavigationStore();

  const { data: buildingData } = useQuery({
    queryKey: ["buildings", buildingId],
    queryFn: () => getBuildingById(buildingId!),
    enabled: !!buildingId,
  });

  const { data: aptData, isLoading: aptLoading, error: aptError, refetch: refetchApt } = useQuery({
    queryKey: ["apartments", buildingId, apartmentId],
    queryFn: () => getApartmentById(buildingId!, apartmentId!),
    enabled: !!buildingId && !!apartmentId,
  });

  const building = buildingData?.data.data;
  const apartment = aptData?.data.data;
  const isOccupied = apartment?.status === "occupied";

  // Fetch tenant if occupied
  const { data: tenantData, isLoading: tenantLoading } = useQuery({
    queryKey: ["tenants", "active", apartmentId],
    queryFn: () => getActiveTenant(apartmentId!),
    enabled: isOccupied && !!apartmentId,
  });

  const tenant = tenantData?.data.data;

  // Fetch dues if occupied
  const { data: duesData, isLoading: duesLoading } = useQuery({
    queryKey: ["dues", tenant?.public_id],
    queryFn: () => getDues(tenant!.public_id, { page: 1, page_size: 100 }),
    enabled: isOccupied && !!tenant?.public_id,
  });

  const dues: MonthlyDue[] = duesData?.data.data ?? [];

  useEffect(() => {
    if (building) setActiveBuilding(buildingId ?? null, building.name);
    if (apartment) setActiveApartment(apartmentId ?? null, `ইউনিট ${apartment.unit_number}`);
    return () => {
      setActiveBuilding(null);
      setActiveApartment(null);
    };
  }, [building, apartment, buildingId, apartmentId, setActiveBuilding, setActiveApartment]);

  if (aptLoading) {
    return <LoadingSpinner />;
  }

  if (aptError || !apartment) {
    return <ErrorState onRetry={() => refetchApt()} />;
  }

  return (
    <div ref={contentRef}>
      <PrintButton contentRef={contentRef} documentTitle={`ইউনিট ${apartment.unit_number}`} />

      {/* Apartment info */}
      <div className="bg-surface rounded-xl p-5 border border-border mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success-bg flex items-center justify-center">
              <DoorOpen size={20} className="text-success" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                ইউনিট {apartment.unit_number}
              </h2>
              <p className="text-sm text-text-secondary">তলা {apartment.floor}</p>
            </div>
          </div>
          <StatusBadge status={apartment.status} />
        </div>
      </div>

      {!isOccupied ? (
        <EmptyState
          title="এই অ্যাপার্টমেন্ট খালি"
          description="ভাড়াটে যোগ করতে নিচের বাটনে ক্লিক করুন"
          icon={<DoorOpen size={48} />}
          action={
            <Button
              onClick={() => setAssignOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus size={16} className="mr-1.5" />
              ভাড়াটে যোগ করুন
            </Button>
          }
        />
      ) : tenantLoading ? (
        <LoadingSpinner />
      ) : tenant ? (
        <div className="space-y-6">
          {/* Tenant info card */}
          <div className="bg-surface rounded-xl p-5 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-success-bg flex items-center justify-center">
                  <User size={20} className="text-success" />
                </div>
                <div>
                  <h3 className="font-medium text-text-primary">{tenant.full_name}</h3>
                  <p className="text-sm text-text-secondary">{tenant.phone}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditTenant(tenant)}
                >
                  <Edit2 size={14} className="mr-1" />
                  সম্পাদনা
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-danger border-danger"
                  onClick={() => setMoveOutOpen(true)}
                >
                  <LogOut size={14} className="mr-1" />
                  চলে গেছে
                </Button>
              </div>
            </div>
            {tenant.nid_number && (
              <p className="text-sm text-text-secondary">এনআইডি: {tenant.nid_number}</p>
            )}
            {tenant.address && (
              <p className="text-sm text-text-secondary">ঠিকানা: {tenant.address}</p>
            )}
            <p className="text-sm text-text-secondary">
              প্রবেশ: {tenant.move_in_date} • সদস্য: {tenant.member_count}
            </p>
          </div>

          {/* Dues table */}
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-sm font-medium text-text-primary">মাসিক ডিউ</h3>
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
              <div className="p-4 text-center text-sm text-text-secondary">লোড হচ্ছে...</div>
            ) : dues.length === 0 ? (
              <div className="p-4 text-center text-sm text-text-secondary">কোনো ডিউ নেই</div>
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
                      <th className="text-right px-3 py-2 font-medium text-text-secondary">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dues.map((due) => (
                      <MonthlyDueRow
                        key={due.public_id}
                        due={due}
                        onPay={() => setPayingDue(due)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <AssignTenant
        open={assignOpen}
        onOpenChange={setAssignOpen}
        apartmentId={apartmentId!}
      />
      {editTenant && (
        <EditTenantInfo
          open={!!editTenant}
          onOpenChange={(open) => {
            if (!open) setEditTenant(null);
          }}
          apartmentId={apartmentId!}
          tenant={editTenant}
        />
      )}
      {moveOutOpen && tenant && (
        <MoveOutTenant
          open={moveOutOpen}
          onOpenChange={setMoveOutOpen}
          apartmentId={apartmentId!}
          tenant={tenant}
        />
      )}
      <GenerateMonthlyDue
        open={generateDueOpen}
        onOpenChange={setGenerateDueOpen}
        tenantId={tenant?.public_id ?? ""}
      />
      {payingDue && (
        <RecordPayment
          open={!!payingDue}
          onOpenChange={(open) => {
            if (!open) setPayingDue(null);
          }}
          due={payingDue}
          tenantId={tenant?.public_id ?? ""}
        />
      )}
    </div>
  );
}
