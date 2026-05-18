import { addTenant } from "@/api/tenants.api";
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
import { tenantSchema, type TenantInput } from "@/lib/validators/tenant";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import toast from "react-hot-toast";

interface AssignTenantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartmentId: string;
}

export default function AssignTenant({ open, onOpenChange, apartmentId }: AssignTenantProps) {
  const queryClient = useQueryClient();

  const form = useForm<TenantInput>({
    resolver: zodResolver(tenantSchema) as Resolver<TenantInput>,
    defaultValues: {
      full_name: "",
      phone: "",
      nid_number: "",
      address: "",
      member_count: 1,
      move_in_date: "",
      initial_rent_amount: 0,
      agreement_start_date: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: TenantInput) =>
      addTenant(apartmentId, {
        full_name: data.full_name,
        phone: data.phone,
        nid_number: data.nid_number,
        address: data.address,
        member_count: data.member_count,
        move_in_date: data.move_in_date,
        initial_rent_amount: data.initial_rent_amount,
        agreement_start_date: data.agreement_start_date,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["apartments"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success(res.data.message || "ভাড়াটে যোগ হয়েছে");
      form.reset();
      onOpenChange(false);
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      getFallback({ error });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ভাড়াটে যোগ করুন</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => mutate(data))}
            className="space-y-4"
          >
            <FormInput
              form={form}
              name="full_name"
              label="পূর্ণ নাম"
              isRequired
              placeholder="ভাড়াটের নাম"
            />
            <FormInput
              form={form}
              name="phone"
              label="ফোন নম্বর"
              isRequired
              placeholder="01XXXXXXXXX"
            />
            <FormInput
              form={form}
              name="nid_number"
              label="এনআইডি নম্বর"
              placeholder="ঐচ্ছিক"
            />
            <FormInput
              form={form}
              name="address"
              label="ঠিকানা"
              placeholder="ঐচ্ছিক"
            />
            <FormInput
              form={form}
              name="member_count"
              label="পরিবারের সদস্য সংখ্যা"
              isRequired
              type="number"
              placeholder="1"
            />
            <FormDatePicker
              form={form}
              name="move_in_date"
              label="প্রবেশের তারিখ"
              isRequired
            />
            <FormInput
              form={form}
              name="initial_rent_amount"
              label="মাসিক ভাড়া (৳)"
              isRequired
              type="number"
              placeholder="10000"
            />
            <FormDatePicker
              form={form}
              name="agreement_start_date"
              label="চুক্তির শুরুর তারিখ"
              isRequired
            />
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isPending && <Loader2 size={16} className="animate-spin mr-1.5" />}
                যোগ করুন
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
