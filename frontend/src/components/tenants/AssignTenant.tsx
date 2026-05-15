import { addTenant } from "@/api/tenants.api";
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
import { getFallback } from "@/lib/getFallback";
import { tenantSchema, type TenantInput } from "@/lib/validators/tenant";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

interface AssignTenantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartmentId: string;
}

export default function AssignTenant({ open, onOpenChange, apartmentId }: AssignTenantProps) {
  const queryClient = useQueryClient();

  const form = useForm<TenantInput>({
    resolver: zodResolver(tenantSchema),
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
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>পূর্ণ নাম <span className="text-danger">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="ভাড়াটের নাম" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ফোন নম্বর <span className="text-danger">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="01XXXXXXXXX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nid_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>এনআইডি নম্বর</FormLabel>
                  <FormControl>
                    <Input placeholder="ঐচ্ছিক" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ঠিকানা</FormLabel>
                  <FormControl>
                    <Input placeholder="ঐচ্ছিক" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="member_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>পরিবারের সদস্য সংখ্যা <span className="text-danger">*</span></FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="move_in_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>প্রবেশের তারিখ <span className="text-danger">*</span></FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="initial_rent_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>মাসিক ভাড়া (৳) <span className="text-danger">*</span></FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="10000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="agreement_start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>চুক্তির শুরুর তারিখ <span className="text-danger">*</span></FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
