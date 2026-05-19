import { markMovedOut } from "@/api/tenants.api";
import FormDatePicker from "@/components/custom-ui/form/FormDatePicker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { getFallback } from "@/lib/getFallback";
import type { TENANT } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const moveOutSchema = z.object({
  move_out_date: z.string().min(1, "চলে যাওয়ার তারিখ প্রয়োজন"),
});

type MoveOutInput = z.infer<typeof moveOutSchema>;

interface MoveOutTenantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartmentId: string;
  tenant: TENANT;
}

export default function MoveOutTenant({ open, onOpenChange, apartmentId, tenant }: MoveOutTenantProps) {
  const queryClient = useQueryClient();

  const form = useForm<MoveOutInput>({
    resolver: zodResolver(moveOutSchema),
    defaultValues: { move_out_date: "" },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: MoveOutInput) => markMovedOut(apartmentId, tenant.public_id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["apartments"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["tenants", tenant.public_id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["overdue-list"] });
      toast.success(res.data.message || "ভাড়াটে চলে গেছে");
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
          <DialogTitle>ভাড়াটে চলে গেছে</DialogTitle>
          <DialogDescription>
            {tenant.full_name} এর চলে যাওয়ার তারিখ নির্ধারণ করুন
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => mutate(data))}
            className="space-y-4"
          >
            <FormDatePicker
              form={form}
              name="move_out_date"
              label="চলে যাওয়ার তারিখ"
              isRequired
            />
            <p className="text-sm text-text-secondary">
              এটি ভাড়াটেকে নিষ্ক্রিয় করবে এবং অ্যাপার্টমেন্ট খালি হয়ে যাবে।
            </p>
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isPending}
                className="bg-destructive hover:bg-destructive/90 text-white"
              >
                {isPending && <Loader2 size={16} className="animate-spin mr-1.5" />}
                নিশ্চিত করুন
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
