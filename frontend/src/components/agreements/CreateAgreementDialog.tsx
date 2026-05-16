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
import { getFallback } from "@/lib/getFallback";
import {
  agreementSchema,
  type AgreementInput,
} from "@/lib/validators/agreement";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
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

  const form = useForm<AgreementInput>({
    resolver: zodResolver(agreementSchema),
    defaultValues: {
      rent_amount: "" as unknown as number,
      start_date: new Date().toISOString().split("T")[0],
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: AgreementInput) =>
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
            <FormInput
              form={form}
              name="start_date"
              label="শুরুর তারিখ"
              isRequired
              type="date"
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
