import { updateTenant } from "@/api/tenants.api";
import FormInput from "@/components/custom-ui/form/FormInput";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { getFallback } from "@/lib/getFallback";
import { editTenantSchema, type EditTenantInput } from "@/lib/validators/tenant";
import type { Tenant } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

interface EditTenantInfoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartmentId: string;
  tenant: Tenant;
}

export default function EditTenantInfo({ open, onOpenChange, apartmentId, tenant }: EditTenantInfoProps) {
  const queryClient = useQueryClient();

  const form = useForm<EditTenantInput>({
    resolver: zodResolver(editTenantSchema),
    defaultValues: {
      full_name: tenant.full_name,
      phone: tenant.phone,
      nid_number: tenant.nid_number ?? "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: EditTenantInput) =>
      updateTenant(apartmentId, tenant.public_id, {
        full_name: data.full_name,
        phone: data.phone,
        nid_number: data.nid_number || undefined,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["tenants", tenant.public_id] });
      queryClient.invalidateQueries({ queryKey: ["apartments"] });
      toast.success(res.data.message || "ভাড়াটে আপডেট হয়েছে");
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
          <DialogTitle>ভাড়াটে তথ্য সম্পাদনা</DialogTitle>
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
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isPending && <Loader2 size={16} className="animate-spin mr-1.5" />}
                আপডেট করুন
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
