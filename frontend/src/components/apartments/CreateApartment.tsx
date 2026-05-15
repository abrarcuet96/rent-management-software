import { createApartment } from "@/api/apartments.api";
import ApartmentMutationForm from "@/components/apartments/ApartmentMutationForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getFallback } from "@/lib/getFallback";
import type { ApartmentInput } from "@/lib/validators/apartment";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";

interface CreateApartmentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildingId: string;
}

export default function CreateApartment({ open, onOpenChange, buildingId }: CreateApartmentProps) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (data: ApartmentInput) => createApartment(buildingId, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["apartments", buildingId] });
      toast.success(res.data.message || "অ্যাপার্টমেন্ট তৈরি হয়েছে");
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
          <DialogTitle>নতুন অ্যাপার্টমেন্ট</DialogTitle>
        </DialogHeader>
        <ApartmentMutationForm
          onSubmit={(data) => mutate(data)}
          isPending={isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
