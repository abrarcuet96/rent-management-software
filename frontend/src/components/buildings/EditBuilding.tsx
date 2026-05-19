import { updateBuilding } from "@/api/buildings.api";
import BuildingMutationForm from "@/components/buildings/BuildingMutationForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getFallback } from "@/lib/getFallback";
import type { CREATE_BUILDING } from "@/schemas/building.schema";
import type { BUILDING } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";

interface EditBuildingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  building: BUILDING;
}

export default function EditBuilding({ open, onOpenChange, building }: EditBuildingProps) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CREATE_BUILDING) => updateBuilding(building.public_id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      queryClient.invalidateQueries({ queryKey: ["buildings", building.public_id] });
      toast.success(res.data.message || "বিল্ডিং আপডেট হয়েছে");
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
          <DialogTitle>বিল্ডিং সম্পাদনা</DialogTitle>
        </DialogHeader>
        <BuildingMutationForm
          onSubmit={(data) => mutate(data)}
          isPending={isPending}
          defaultValues={{
            name: building.name,
            address: building.address,
            total_floors: building.total_floors,
          }}
          mode="edit"
        />
      </DialogContent>
    </Dialog>
  );
}
