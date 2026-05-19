import { createBuilding } from "@/api/buildings.api";
import BuildingMutationForm from "@/components/buildings/BuildingMutationForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getFallback } from "@/lib/getFallback";
import type { CREATE_BUILDING } from "@/schemas/building.schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";

interface CreateBuildingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateBuilding({ open, onOpenChange }: CreateBuildingProps) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: createBuilding,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      toast.success(res.data.message || "বিল্ডিং তৈরি হয়েছে");
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
          <DialogTitle>নতুন বিল্ডিং</DialogTitle>
        </DialogHeader>
        <BuildingMutationForm onSubmit={(data: CREATE_BUILDING) => mutate(data)} isPending={isPending} />
      </DialogContent>
    </Dialog>
  );
}
