import { recordPayment } from "@/api/payments.api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

interface RecordPaymentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  due: MonthlyDue;
  tenantId: string;
}

type PaymentInput = { amount: number; paid_on: string; note?: string };

export default function RecordPayment({
  open,
  onOpenChange,
  due,
}: RecordPaymentProps) {
  const queryClient = useQueryClient();

  const remainingBalance = parseFloat(due.remaining_balance);
  const paymentSchema = z.object({
    amount: z.coerce
      .number()
      .min(0.01, "পরিমাণ প্রয়োজন")
      .max(
        remainingBalance,
        `সর্বোচ্চ ${formatCurrency(remainingBalance)} পর্যন্ত`,
      ),
    paid_on: z.string().min(1, "তারিখ প্রয়োজন"),
    note: z.string().optional(),
  });

  const form = useForm<PaymentInput>({
    resolver: zodResolver(paymentSchema) as Resolver<PaymentInput>,
    defaultValues: {
      amount: remainingBalance,
      paid_on: new Date().toISOString().split("T")[0],
      note: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: PaymentInput) =>
      recordPayment(due.public_id, {
        amount: data.amount,
        paid_on: data.paid_on,
        note: data.note || undefined,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["dues"] });
      queryClient.invalidateQueries({ queryKey: ["payments", due.public_id] });
      queryClient.invalidateQueries({ queryKey: ["overdue-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(res.data.message || "পেমেন্ট রেকর্ড হয়েছে");
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
          <DialogTitle>পেমেন্ট রেকর্ড করুন</DialogTitle>
        </DialogHeader>
        <div className="bg-neutral-bg rounded-lg p-3 mb-4">
          <p className="text-sm text-text-secondary">
            বাকি:{" "}
            <span className="font-semibold text-danger">
              {formatCurrency(due.remaining_balance)}
            </span>
          </p>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => mutate(data))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    পেমেন্ট পরিমাণ (৳) <span className="text-danger">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paid_on"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    পেমেন্টের তারিখ <span className="text-danger">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>নোট (ঐচ্ছিক)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="কোনো মন্তব্য..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
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
                পেমেন্ট করুন
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
