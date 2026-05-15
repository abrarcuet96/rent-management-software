import ConfirmDialog from "@/components/common/ConfirmDialog";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { getFallback } from "@/lib/getFallback";
import type { Apartment } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { ChevronRight, DoorOpen, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { deleteApartment } from "@/api/apartments.api";

interface ApartmentCardProps {
  apartment: Apartment;
  buildingId: string;
  onEdit: () => void;
}

export default function ApartmentCard({ apartment, buildingId, onEdit }: ApartmentCardProps) {
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

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
                  ইউনিট {apartment.unit_number}
                </h3>
                <p className="text-sm text-text-secondary mt-0.5">
                  তলা {apartment.floor}
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
          <Link
            to={`/buildings/${buildingId}/apartments/${apartment.public_id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            বিস্তারিত
            <ChevronRight size={13} />
          </Link>

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
