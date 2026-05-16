import { recordBulkPayment } from "@/api/payments.api";
import { getDues } from "@/api/dues.api";
import { getTenants } from "@/api/tenants.api";
import BulkDistributionPreview from "@/components/payments/BulkDistributionPreview";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFallback } from "@/lib/getFallback";
import { formatCurrency, getMonthName } from "@/lib/utils";
import { bulkPaymentSchema, type BulkPaymentInput } from "@/lib/validators/payment";
import type { MonthlyDue, Tenant } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

export default function BulkPaymentTab() {
  const queryClient = useQueryClient();
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");

  const form = useForm<BulkPaymentInput>({
    resolver: zodResolver(bulkPaymentSchema),
    defaultValues: {
      total_amount: "" as unknown as number,
      paid_on: new Date().toISOString().split("T")[0],
      note: "",
    },
  });

  const totalAmount = form.watch("total_amount");

  const { data: tenantsData } = useQuery({
    queryKey: ["tenants", "all", "bulk-pay"],
    queryFn: () => getTenants({ page: 1, page_size: 100, status: "active" }),
  });

  const tenants: Tenant[] = (tenantsData?.data.data ?? []) as Tenant[];

  const { data: duesData } = useQuery({
    queryKey: ["dues", selectedTenantId, "open"],
    queryFn: () => getDues(selectedTenantId, { page: 1, page_size: 100 }),
    enabled: !!selectedTenantId,
  });

  const allDues: MonthlyDue[] = (duesData?.data.data ?? []) as MonthlyDue[];

  const openDues = allDues
    .filter((d) => d.status === "unpaid" || d.status === "partial")
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

  const previewAmount = Number(totalAmount) > 0 ? Number(totalAmount) : 0;

  const totalOutstanding = openDues.reduce((s, d) => s + Number(d.remaining_balance), 0);
  const isOverpaying = previewAmount > 0 && totalOutstanding > 0 && previewAmount > totalOutstanding;

  const { mutate, isPending } = useMutation({
    mutationFn: (data: BulkPaymentInput) =>
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

  const canSubmit = selectedTenantId && previewAmount > 0 && openDues.length > 0 && !isOverpaying;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-surface rounded-xl p-6 border border-border space-y-6">
        {/* Tenant selector */}
        <div>
          <label className="text-sm font-medium">
            ভাড়াটে <span className="text-danger">*</span>
          </label>
          <Select
            value={selectedTenantId}
            onValueChange={setSelectedTenantId}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="ভাড়াটে বেছে নিন" />
            </SelectTrigger>
            <SelectContent>
              {tenants.map((t) => (
                <SelectItem key={t.public_id} value={t.public_id}>
                  {t.full_name} - {t.building_name} - {t.apartment_unit_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => mutate(data))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="total_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    মোট পেমেন্ট পরিমাণ (৳) <span className="text-danger">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                  {isOverpaying && (
                    <p className="text-xs text-danger mt-1">
                      সর্বোচ্চ {formatCurrency(totalOutstanding)} পর্যন্ত দেওয়া সম্ভব — মোট বকেয়া এর বেশি গ্রহণযোগ্য নয়
                    </p>
                  )}
                  {!isOverpaying && previewAmount > 0 && totalOutstanding > 0 && (
                    <p className="text-xs text-text-secondary mt-1">
                      মোট বকেয়া: {formatCurrency(totalOutstanding)}
                    </p>
                  )}
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
                    <Textarea placeholder="কোনো মন্তব্য..." rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Show as soon as a tenant is selected */}
            {selectedTenantId && openDues.length === 0 && (
              <p className="text-sm text-text-secondary text-center py-4">
                এই ভাড়াটের কোনো বকেয়া ডিউ নেই
              </p>
            )}

            {selectedTenantId && openDues.length > 0 && previewAmount === 0 && (
              <div>
                <p className="text-sm font-medium text-text-secondary mb-2">
                  বকেয়া ডিউ ({openDues.length}টি)
                </p>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-bg">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-text-secondary">মাস/বছর</th>
                        <th className="text-right px-3 py-2 font-medium text-text-secondary">মোট দেয়</th>
                        <th className="text-right px-3 py-2 font-medium text-text-secondary">পরিশোধিত</th>
                        <th className="text-right px-3 py-2 font-medium text-text-secondary">বাকি</th>
                      </tr>
                    </thead>
                    <tbody>
                      {openDues.map((due) => (
                        <tr key={due.public_id} className="border-t border-border">
                          <td className="px-3 py-2 text-text-primary">
                            {getMonthName(due.month)} {due.year}
                          </td>
                          <td className="px-3 py-2 text-right text-text-primary">
                            {formatCurrency(due.total_due)}
                          </td>
                          <td className="px-3 py-2 text-right text-success">
                            {formatCurrency(due.amount_paid)}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-danger">
                            {formatCurrency(due.remaining_balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-neutral-bg">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 font-medium text-text-primary">মোট বাকি</td>
                        <td className="px-3 py-2 text-right font-medium text-danger">
                          {formatCurrency(openDues.reduce((s, d) => s + Number(d.remaining_balance), 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
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
