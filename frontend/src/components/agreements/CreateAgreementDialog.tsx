import { createAgreement } from "@/api/agreements.api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
} from "@/components/ui/form";
import FormInput from "@/components/custom-ui/form/FormInput";
import FormDatePicker from "@/components/custom-ui/form/FormDatePicker";
import { getFallback } from "@/lib/getFallback";
import {
  agreementSchema,
  type CREATE_AGREEMENT,
} from "@/schemas/agreement.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import toast from "react-hot-toast";

interface CreateAgreementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
}

export default function CreateAgreementDialog({
  open,
  onOpenChange,
  tenantId,
}: CreateAgreementDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<CREATE_AGREEMENT>({
    resolver: zodResolver(agreementSchema) as Resolver<CREATE_AGREEMENT>,
    defaultValues: {
      start_date: new Date().toISOString().split("T")[0],
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CREATE_AGREEMENT) =>
      createAgreement(tenantId, {
        rent_amount: data.rent_amount,
        start_date: data.start_date,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["agreements", tenantId] });
      toast.success(res.data.message || "চুক্তি তৈরি হয়েছে");
      form.reset();
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
          <DialogTitle>নতুন চুক্তি</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => mutate(data))}
            className="space-y-4"
          >
            <FormInput
              form={form}
              name="rent_amount"
              label="ভাড়ার পরিমাণ (৳)"
              isRequired
              type="number"
              placeholder="0"
            />
            <FormDatePicker
              form={form}
              name="start_date"
              label="শুরুর তারিখ"
              isRequired
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
                তৈরি করুন
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
