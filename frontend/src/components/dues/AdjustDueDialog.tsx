import { adjustDue } from "@/api/dues.api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import FormInput from "@/components/custom-ui/form/FormInput";
import FormDatePicker from "@/components/custom-ui/form/FormDatePicker";
import { getFallback } from "@/lib/getFallback";
import { formatCurrency } from "@/lib/utils";
import type { MonthlyDue } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

const adjustDueSchema = z.object({
  total_due: z.coerce.number().min(0, "পরিমাণ ০ বা তার বেশি হতে হবে").optional(),
  rent_amount: z.coerce.number().min(0.01, "ভাড়ার পরিমাণ প্রয়োজন").optional(),
  due_date: z.string().optional(),
});

type AdjustDueInput = z.infer<typeof adjustDueSchema>;

interface AdjustDueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  due: MonthlyDue;
  tenantId: string;
}

export default function AdjustDueDialog({
  open,
  onOpenChange,
  due,
}: AdjustDueDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<AdjustDueInput>({
    resolver: zodResolver(adjustDueSchema) as Resolver<AdjustDueInput>,
    defaultValues: {
      total_due: parseFloat(due.total_due),
      rent_amount: parseFloat(due.rent_amount),
      due_date: due.due_date ?? "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: AdjustDueInput) => {
      const payload: Record<string, unknown> = {};
      if (data.total_due !== undefined && data.total_due !== parseFloat(due.total_due))
        payload.total_due = data.total_due;
      if (data.rent_amount !== undefined && data.rent_amount !== parseFloat(due.rent_amount))
        payload.rent_amount = data.rent_amount;
      if (data.due_date !== undefined && data.due_date !== (due.due_date ?? ""))
        payload.due_date = data.due_date || undefined;
      return adjustDue(due.public_id, payload);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["dues"] });
      queryClient.invalidateQueries({ queryKey: ["overdue-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(res.data.message || "ডিউ আপডেট হয়েছে");
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
          <DialogTitle>ডিউ সম্পাদনা</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => mutate(data))}
            className="space-y-4"
          >
            <div className="bg-neutral-bg rounded-lg p-3 text-sm">
              <span className="text-text-secondary">বর্তমান: </span>
              <span className="text-text-primary font-medium">
                {formatCurrency(due.total_due)}
              </span>
            </div>

            <FormInput
              form={form}
              name="total_due"
              label="মোট দেয় (৳)"
              type="number"
              placeholder={due.total_due}
              onChange={(e) => {
                const val = e.target.value;
                form.setValue("total_due", val === "" ? undefined : Number(val), {
                  shouldValidate: true,
                });
              }}
            />

            <FormInput
              form={form}
              name="rent_amount"
              label="ভাড়া (৳)"
              type="number"
              placeholder={due.rent_amount}
              onChange={(e) => {
                const val = e.target.value;
                form.setValue("rent_amount", val === "" ? undefined : Number(val), {
                  shouldValidate: true,
                });
              }}
            />

            <FormDatePicker
              form={form}
              name="due_date"
              label="ডিউ ডেট"
            />

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isPending && (
                  <Loader2 size={16} className="animate-spin mr-1.5" />
                )}
                আপডেট করুন
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
