import { getActiveTenant } from "@/api/tenants.api";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { getFallback } from "@/lib/getFallback";
import type { APARTMENT, TENANT } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFetchData } from "@/hooks/useFetchData";
import type { AxiosError } from "axios";
import { ChevronDown, ChevronUp, DoorOpen, Pencil, Phone, Plus, Trash2, User } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { deleteApartment } from "@/api/apartments.api";
import { toBn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface ApartmentCardProps {
  apartment: APARTMENT;
  buildingId: string;
  onEdit: () => void;
  onAssignTenant?: () => void;
}

function OccupiedTenantPanel({ apartmentId }: { apartmentId: string }) {
  const { data, isLoading } = useFetchData({
    queryKey: ["tenants", "active", apartmentId],
    queryFn: () => getActiveTenant(apartmentId),
  });

  const tenant: TENANT | undefined = data?.data.data;

  if (isLoading) {
    return (
      <div className="px-4 py-3 border-t border-border">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="px-4 py-3 border-t border-border">
        <p className="text-xs text-text-secondary">তথ্য পাওয়া যায়নি</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-t border-border bg-neutral-bg/60 space-y-1.5">
      <div className="flex items-center gap-2">
        <User size={13} className="text-text-secondary shrink-0" />
        <Link
          to={`/tenants/${tenant.public_id}`}
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors truncate"
          onClick={(e) => e.stopPropagation()}
        >
          {tenant.full_name}
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <Phone size={13} className="text-text-secondary shrink-0" />
        <span className="text-xs text-text-secondary">{tenant.phone}</span>
      </div>
      <p className="text-xs text-text-secondary">
        প্রবেশ: {tenant.move_in_date}
      </p>
    </div>
  );
}

export default function ApartmentCard({ apartment, buildingId, onEdit, onAssignTenant }: ApartmentCardProps) {
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tenantPanelOpen, setTenantPanelOpen] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: () => deleteApartment(buildingId, apartment.public_id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["apartments", buildingId] });
      toast.success(res.data.message || "অ্যাপার্টমেন্ট মুছে ফেলা হয়েছে");
      setConfirmOpen(false);
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      getFallback({ error });
      setConfirmOpen(false);
    },
  });

  const isOccupied = apartment.status === "occupied";

  return (
    <>
      <div className="bg-surface rounded-xl border border-border flex flex-col overflow-hidden hover:shadow-md transition-shadow duration-200">
        {/* Card body */}
        <div className="p-4 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-success-bg flex items-center justify-center shrink-0">
                <DoorOpen size={20} className="text-success" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-text-primary leading-tight">
                  ইউনিট {toBn(apartment.unit_number)}
                </h3>
                <p className="text-sm text-text-secondary mt-0.5">
                  তলা {toBn(apartment.floor)}
                </p>
              </div>
            </div>
            <div className="shrink-0 pt-0.5">
              <StatusBadge status={apartment.status} />
            </div>
          </div>
        </div>

        {/* Card footer */}
        <div className="border-t border-border px-4 py-2.5 flex items-center justify-between bg-neutral-bg/40">
          {/* Left action: vacant → assign, occupied → toggle tenant info */}
          {isOccupied ? (
            <Button
              variant="ghost"
              className="h-auto p-0 text-xs font-medium text-primary hover:text-primary/80 hover:bg-transparent gap-1"
              onClick={() => setTenantPanelOpen((v) => !v)}
            >
              {tenantPanelOpen ? (
                <>
                  <ChevronUp size={13} />
                  লুকান
                </>
              ) : (
                <>
                  <ChevronDown size={13} />
                  ভাড়াটে দেখুন
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="h-auto p-0 text-xs font-medium text-primary hover:text-primary/80 hover:bg-transparent gap-1"
              onClick={onAssignTenant}
            >
              <Plus size={13} />
              ভাড়াটে যোগ করুন
            </Button>
          )}

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-text-secondary hover:text-text-primary hover:bg-surface"
              onClick={onEdit}
            >
              <Pencil size={13} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-danger/70 hover:text-danger hover:bg-danger-bg"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 size={13} />
            </Button>
          </div>
        </div>

        {/* Expandable occupied tenant panel */}
        {isOccupied && tenantPanelOpen && (
          <OccupiedTenantPanel apartmentId={apartment.public_id} />
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="অ্যাপার্টমেন্ট মুছুন"
        description="আপনি কি নিশ্চিত যে এই অ্যাপার্টমেন্টটি মুছে ফেলতে চান?"
        onConfirm={() => mutate()}
        isPending={isPending}
        confirmLabel="মুছে ফেলুন"
        variant="danger"
      />
    </>
  );
}
