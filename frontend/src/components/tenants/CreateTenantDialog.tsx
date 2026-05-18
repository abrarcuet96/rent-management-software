import { getApartments } from "@/api/apartments.api";
import { getBuildings } from "@/api/buildings.api";
import { addTenant } from "@/api/tenants.api";
import FormDatePicker from "@/components/custom-ui/form/FormDatePicker";
import FormInput from "@/components/custom-ui/form/FormInput";
import FormSearchSelect from "@/components/custom-ui/form/FormSearchSelect";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFallback } from "@/lib/getFallback";
import { tenantSchema } from "@/lib/validators/tenant";
import type { Apartment } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { useForm, type Resolver } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

const createTenantSchema = tenantSchema.extend({
  building_public_id: z.string().min(1, "বিল্ডিং বেছে নিন"),
  apartment_public_id: z.string().min(1, "অ্যাপার্টমেন্ট বেছে নিন"),
});

type CreateTenantInput = z.infer<typeof createTenantSchema>;

interface CreateTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateTenantDialog({
  open,
  onOpenChange,
}: CreateTenantDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<CreateTenantInput>({
    resolver: zodResolver(createTenantSchema) as Resolver<CreateTenantInput>,
    defaultValues: {
      building_public_id: "",
      apartment_public_id: "",
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

  const buildingId = form.watch("building_public_id");

  // Fetch vacant apartments for the selected building
  const { data: apartmentsData, isLoading: loadingApartments } = useQuery({
    queryKey: ["apartments", buildingId, "vacant"],
    queryFn: () =>
      getApartments(buildingId, { page: 1, page_size: 100, status: "vacant" }),
    enabled: !!buildingId,
  });

  const vacantApartments: Apartment[] = apartmentsData?.data.data ?? [];

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateTenantInput) =>
      addTenant(data.apartment_public_id, {
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

  // Reset apartment selection whenever building changes
  const prevBuildingRef = useRef("");
  useEffect(() => {
    if (prevBuildingRef.current !== buildingId) {
      prevBuildingRef.current = buildingId;
      if (prevBuildingRef.current) {
        form.setValue("apartment_public_id", "");
      }
    }
  }, [buildingId, form]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) form.reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-lg rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>নতুন ভাড়াটে যোগ করুন</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => mutate(data))}
            className="space-y-4"
          >
            {/* ── Location selectors ── */}
            <div className="rounded-lg border border-border bg-neutral-bg p-4 space-y-3">
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                অ্যাপার্টমেন্ট নির্বাচন
              </p>

              <FormSearchSelect
                form={form}
                name="building_public_id"
                label="বিল্ডিং"
                isRequired
                placeholder="বিল্ডিং বেছে নিন"
                emptyMessage="কোনো বিল্ডিং নেই — বিল্ডিং পেজে গিয়ে তৈরি করুন"
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

              {/* Override onChange to also reset apartment */}
              {buildingId && (
                <FormField
                  control={form.control}
                  name="apartment_public_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        অ্যাপার্টমেন্ট <span className="text-danger">*</span>
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={loadingApartments}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                loadingApartments ? (
                                  <span className="flex items-center gap-1.5">
                                    <Loader2
                                      size={14}
                                      className="animate-spin"
                                    />
                                    লোড হচ্ছে...
                                  </span>
                                ) : (
                                  "অ্যাপার্টমেন্ট বেছে নিন"
                                )
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {!loadingApartments &&
                          vacantApartments.length === 0 ? (
                            <div className="px-3 py-4 text-center text-xs text-text-secondary">
                              এই বিল্ডিংয়ে কোনো খালি অ্যাপার্টমেন্ট নেই
                            </div>
                          ) : (
                            vacantApartments.map((a) => (
                              <SelectItem key={a.public_id} value={a.public_id}>
                                ইউনিট {a.unit_number} — {a.floor} তলা
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {!buildingId && (
                <p className="text-xs text-text-secondary">
                  প্রথমে বিল্ডিং বেছে নিন, তারপর অ্যাপার্টমেন্ট দেখাবে
                </p>
              )}
            </div>

            {/* ── Tenant fields ── */}
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
                {isPending && (
                  <Loader2 size={16} className="animate-spin mr-1.5" />
                )}
                যোগ করুন
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
