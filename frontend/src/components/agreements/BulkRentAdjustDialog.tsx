import { bulkAdjustRent } from "@/api/agreements.api";
import { getBuildings } from "@/api/buildings.api";
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
import FormSearchSelect from "@/components/custom-ui/form/FormSearchSelect";
import FormStaticSelect from "@/components/custom-ui/form/FormStaticSelect";
import { getFallback } from "@/lib/getFallback";
import { toBn } from "@/lib/utils";
import {
  bulkRentAdjustSchema,
  type BULK_RENT_ADJUST_INPUT,
} from "@/schemas/agreement.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import toast from "react-hot-toast";

interface BulkRentAdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BulkRentAdjustDialog({
  open,
  onOpenChange,
}: BulkRentAdjustDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<BULK_RENT_ADJUST_INPUT>({
    resolver: zodResolver(bulkRentAdjustSchema) as Resolver<BULK_RENT_ADJUST_INPUT>,
    defaultValues: {
      adjustment_type: "fixed",
      scope: "all",
      building_public_id: "",
      effective_date: new Date().toISOString().split("T")[0],
    },
  });

  const scope = form.watch("scope");

  const { mutate, isPending } = useMutation({
    mutationFn: (data: BULK_RENT_ADJUST_INPUT) =>
      bulkAdjustRent({
        adjustment_type: data.adjustment_type,
        amount: data.amount,
        scope: data.scope,
        building_public_id:
          data.scope === "building" ? data.building_public_id : undefined,
        effective_date: data.effective_date,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["agreements"] });
      toast.success(
        res.data.message ||
          `${toBn(res.data.data.tenants_adjusted)} জন ভাড়াটের ভাড়া আপডেট হয়েছে`,
      );
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
          <DialogTitle>বাল্ক ভাড়া সমন্বয়</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => mutate(data))}
            className="space-y-4"
          >
            <FormStaticSelect
              form={form}
              name="adjustment_type"
              label="অ্যাডজাস্টমেন্ট টাইপ"
              isRequired
              options={[
                { value: "fixed", label: "নির্দিষ্ট পরিমাণ (+/-)" },
                { value: "percentage", label: "শতকরা (%)" },
              ]}
            />

            <FormInput
              form={form}
              name="amount"
              label="পরিমাণ"
              isRequired
              type="number"
              placeholder={
                form.watch("adjustment_type") === "percentage"
                  ? "যেমন: 10 (১০% বৃদ্ধি)"
                  : "যেমন: 500"
              }
            />

            <FormStaticSelect
              form={form}
              name="scope"
              label="স্কোপ"
              isRequired
              options={[
                { value: "all", label: "সকল বিল্ডিং" },
                { value: "building", label: "নির্দিষ্ট বিল্ডিং" },
              ]}
            />

            {scope === "building" && (
              <FormSearchSelect
                form={form}
                name="building_public_id"
                label="বিল্ডিং"
                isRequired
                emptyMessage="কোনো বিল্ডিং নেই — বিল্ডিং পেজে গিয়ে তৈরি করুন।"
                fetcher={async () => {
                  const res = await getBuildings({ page: 1, page_size: 100 });
                  return (res.data.data ?? []).map(
                    (b: { public_id: string; name: string }) => ({
                      value: b.public_id,
                      label: b.name,
                    }),
                  );
                }}
              />
            )}

            <FormDatePicker
              form={form}
              name="effective_date"
              label="কার্যকর তারিখ"
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
                প্রয়োগ করুন
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
