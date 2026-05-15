import { updateApartment } from "@/api/apartments.api";
import ApartmentMutationForm from "@/components/apartments/ApartmentMutationForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getFallback } from "@/lib/getFallback";
import type { Apartment } from "@/types";
import type { ApartmentInput } from "@/lib/validators/apartment";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";

interface EditApartmentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildingId: string;
  apartment: Apartment;
}

export default function EditApartment({ open, onOpenChange, buildingId, apartment }: EditApartmentProps) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (data: ApartmentInput) => updateApartment(buildingId, apartment.public_id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["apartments", buildingId] });
      queryClient.invalidateQueries({ queryKey: ["apartments", buildingId, apartment.public_id] });
      toast.success(res.data.message || "অ্যাপার্টমেন্ট আপডেট হয়েছে");
      onOpenChange(false);
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      getFallback({ error });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle>অ্যাপার্টমেন্ট সম্পাদনা</DialogTitle>
        </DialogHeader>
        <ApartmentMutationForm
          onSubmit={(data) => mutate(data)}
          isPending={isPending}
          defaultValues={{
            unit_number: apartment.unit_number,
            floor: apartment.floor,
            status: apartment.status,
          }}
          mode="edit"
        />
      </DialogContent>
    </Dialog>
  );
}
