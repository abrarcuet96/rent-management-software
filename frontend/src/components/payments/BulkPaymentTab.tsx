import { getDues } from "@/api/dues.api";
import { recordBulkPayment } from "@/api/payments.api";
import { getTenants } from "@/api/tenants.api";
import BulkDistributionPreview from "@/components/payments/BulkDistributionPreview";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import FormInput from "@/components/custom-ui/form/FormInput";
import FormTextArea from "@/components/custom-ui/form/FormTextArea";
import FormDatePicker from "@/components/custom-ui/form/FormDatePicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getFallback } from "@/lib/getFallback";
import { formatCurrency, getMonthName, toBn } from "@/lib/utils";
import {
  bulkPaymentSchema,
  type BULK_PAYMENT_INPUT,
} from "@/schemas/payment.schema";
import type { MONTHLY_DUE, TENANT } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFetchData } from "@/hooks/useFetchData";
import type { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import toast from "react-hot-toast";

export default function BulkPaymentTab() {
  const queryClient = useQueryClient();
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");

  const form = useForm<BULK_PAYMENT_INPUT>({
    resolver: zodResolver(bulkPaymentSchema) as Resolver<BULK_PAYMENT_INPUT>,
    defaultValues: {
      paid_on: new Date().toISOString().split("T")[0],
      note: "",
    },
  });

  const totalAmount = form.watch("total_amount");

  const { data: tenantsData } = useFetchData({
    queryKey: ["tenants", "all", "bulk-pay"],
    queryFn: () => getTenants({ page: 1, page_size: 100, status: "active" }),
  });

  const tenants: TENANT[] = (tenantsData?.data.data ?? []) as TENANT[];

  const { data: duesData } = useFetchData({
    queryKey: ["dues", selectedTenantId, "open"],
    queryFn: () => getDues(selectedTenantId, { page: 1, page_size: 100 }),
    enabled: !!selectedTenantId,
  });

  const allDues: MONTHLY_DUE[] = (duesData?.data.data ?? []) as MONTHLY_DUE[];

  const openDues = allDues
    .filter((d) => d.status === "unpaid" || d.status === "partial")
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

  const previewAmount = Number(totalAmount) > 0 ? Number(totalAmount) : 0;

  const totalOutstanding = openDues.reduce(
    (s, d) => s + Number(d.remaining_balance),
    0,
  );
  const isOverpaying =
    previewAmount > 0 &&
    totalOutstanding > 0 &&
    previewAmount > totalOutstanding;

  const { mutate, isPending } = useMutation({
    mutationFn: (data: BULK_PAYMENT_INPUT) =>
      recordBulkPayment({
        tenant_public_id: selectedTenantId,
        total_amount: data.total_amount,
        paid_on: data.paid_on,
        note: data.note || undefined,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["dues"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["overdue-list"] });
      toast.success(res.data.message || "বাল্ক পেমেন্ট সফল হয়েছে");
      form.reset();
      setSelectedTenantId("");
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      getFallback({ error });
    },
  });

  const canSubmit =
    selectedTenantId &&
    previewAmount > 0 &&
    openDues.length > 0 &&
    !isOverpaying;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-surface rounded-xl p-6 border border-border space-y-6">
        {/* TENANT selector */}
        <div>
          <Label>
            ভাড়াটে <span className="text-danger">*</span>
          </Label>
          <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="ভাড়াটে বেছে নিন" />
            </SelectTrigger>
            <SelectContent>
              {tenants.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-text-secondary">
                  কোনো সক্রিয় ভাড়াটে নেই — ভাড়াটে পেজে গিয়ে যোগ করুন
                </div>
              ) : (
                tenants.map((t) => (
                  <SelectItem key={t.public_id} value={t.public_id}>
                    {t.full_name} - {t.building_name} -{" "}
                    {t.apartment_unit_number}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => mutate(data))}
            className="space-y-4"
          >
            <FormInput
              form={form}
              name="total_amount"
              label="মোট পেমেন্ট পরিমাণ (৳)"
              isRequired
              type="number"
              placeholder="0"
            />
            {isOverpaying && (
              <p className="text-xs text-danger -mt-3">
                সর্বোচ্চ {formatCurrency(totalOutstanding)} পর্যন্ত দেওয়া
                সম্ভব — মোট বকেয়া এর বেশি গ্রহণযোগ্য নয়
              </p>
            )}
            {!isOverpaying &&
              previewAmount > 0 &&
              totalOutstanding > 0 && (
                <p className="text-xs text-text-secondary -mt-3">
                  মোট বকেয়া: {formatCurrency(totalOutstanding)}
                </p>
              )}

            <FormDatePicker
              form={form}
              name="paid_on"
              label="পেমেন্টের তারিখ"
              isRequired
            />

            <FormTextArea
              form={form}
              name="note"
              label="নোট (ঐচ্ছিক)"
              placeholder="কোনো মন্তব্য..."
              rows={2}
            />

            {/* Show as soon as a tenant is selected */}
            {selectedTenantId && openDues.length === 0 && (
              <p className="text-sm text-text-secondary text-center py-4">
                এই ভাড়াটের কোনো বকেয়া নেই
              </p>
            )}

            {selectedTenantId && openDues.length > 0 && previewAmount === 0 && (
              <div>
                <p className="text-sm font-medium text-text-secondary mb-2">
                  বকেয়া ({toBn(openDues.length)}টি)
                </p>
                <div className="border border-border rounded-lg overflow-hidden">
                  <Table className="text-sm">
                    <TableHeader className="bg-neutral-bg">
                      <TableRow>
                        <TableHead className="text-left px-3 py-2 font-medium text-text-secondary">
                          মাস/বছর
                        </TableHead>
                        <TableHead className="text-right px-3 py-2 font-medium text-text-secondary">
                          মোট দেয়
                        </TableHead>
                        <TableHead className="text-right px-3 py-2 font-medium text-text-secondary">
                          পরিশোধিত
                        </TableHead>
                        <TableHead className="text-right px-3 py-2 font-medium text-text-secondary">
                          বাকি
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {openDues.map((due) => (
                        <TableRow
                          key={due.public_id}
                          className="border-t border-border"
                        >
                          <TableCell className="px-3 py-2 text-text-primary">
                            {getMonthName(due.month)} {toBn(due.year)}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-right text-text-primary">
                            {formatCurrency(due.total_due)}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-right text-success">
                            {formatCurrency(due.amount_paid)}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-right font-medium text-danger">
                            {formatCurrency(due.remaining_balance)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter className="bg-neutral-bg">
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="px-3 py-2 font-medium text-text-primary"
                        >
                          মোট বাকি
                        </TableCell>
                        <TableCell className="px-3 py-2 text-right font-medium text-danger">
                          {formatCurrency(
                            openDues.reduce(
                              (s, d) => s + Number(d.remaining_balance),
                              0,
                            ),
                          )}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>
            )}

            {selectedTenantId && openDues.length > 0 && previewAmount > 0 && (
              <div>
                <p className="text-sm font-medium text-text-secondary mb-2">
                  বিতরণ প্রিভিউ (পুরাতন থেকে নতুন)
                </p>
                <BulkDistributionPreview
                  dues={openDues}
                  totalAmount={previewAmount}
                />
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                disabled={isPending || !canSubmit}
                onClick={form.handleSubmit((data) => mutate(data))}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isPending && (
                  <Loader2 size={16} className="animate-spin mr-1.5" />
                )}
                বাল্ক পেমেন্ট করুন
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
