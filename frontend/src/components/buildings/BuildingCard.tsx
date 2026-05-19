import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { getFallback } from "@/lib/getFallback";
import type { BUILDING } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { Building2, Layers, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { deleteBuilding } from "@/api/buildings.api";

interface BuildingCardProps {
  building: BUILDING;
  onEdit: () => void;
}

export default function BuildingCard({ building, onEdit }: BuildingCardProps) {
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: () => deleteBuilding(building.public_id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      toast.success(res.data.message || "বিল্ডিং মুছে ফেলা হয়েছে");
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
        <div className="p-4 flex-1 flex flex-col gap-3">
          {/* Header: icon + name + address */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-success-bg flex items-center justify-center shrink-0">
              <Building2 size={20} className="text-success" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-text-primary truncate leading-tight">
                {building.name}
              </h3>
              <p className="text-sm text-text-secondary truncate mt-0.5">
                {building.address}
              </p>
            </div>
          </div>

          {/* Stat chip */}
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-xs text-text-secondary bg-neutral-bg rounded-md px-2 py-1">
              <Layers size={12} />
              {building.total_floors} তলা
            </span>
          </div>
        </div>

        {/* Card footer */}
        <div className="border-t border-border px-4 py-2.5 flex items-center justify-end bg-neutral-bg/40">
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
        title="বিল্ডিং মুছুন"
        description="আপনি কি নিশ্চিত যে এই বিল্ডিংটি মুছে ফেলতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।"
        onConfirm={() => mutate()}
        isPending={isPending}
        confirmLabel="মুছে ফেলুন"
        variant="danger"
      />
    </>
  );
}
