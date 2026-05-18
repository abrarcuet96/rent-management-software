import { createExpense, updateExpense } from "@/api/expenses.api";
import type { Expense } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import FormInput from "@/components/custom-ui/form/FormInput";
import FormSearchSelect from "@/components/custom-ui/form/FormSearchSelect";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { getFallback } from "@/lib/getFallback";
import {
  expenseSchema,
  type ExpenseInput,
} from "@/lib/validators/expense";
import { getBuildings } from "@/api/buildings.api";
import { getExpenseCategories } from "@/api/expenses.api";
import { getApartments } from "@/api/apartments.api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import toast from "react-hot-toast";

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense;
}

export default function ExpenseFormDialog({
  open,
  onOpenChange,
  expense,
}: ExpenseFormDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = !!expense;

  const form = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema) as Resolver<ExpenseInput>,
    defaultValues: {
      category_public_id: expense?.category_public_id ?? "",
      building_public_id: expense?.building_public_id ?? "",
      apartment_public_id: expense?.apartment_public_id ?? "",
      description: expense?.description ?? "",
      amount: expense?.amount,
      expense_date: expense?.expense_date ?? new Date().toISOString().split("T")[0],
      is_tenant_charged: expense?.is_tenant_charged ?? false,
    },
  });

  const buildingId = form.watch("building_public_id");

  useEffect(() => {
    if (!buildingId) {
      form.setValue("apartment_public_id", "");
    }
  }, [buildingId, form]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: ExpenseInput) => {
      const payload = {
        category_public_id: data.category_public_id,
        building_public_id: data.building_public_id || undefined,
        apartment_public_id: data.apartment_public_id || undefined,
        description: data.description,
        amount: data.amount,
        expense_date: data.expense_date,
        is_tenant_charged: data.is_tenant_charged,
      };
      if (isEdit) {
        return updateExpense(expense!.public_id, payload as { description: string; amount: number; expense_date: string; is_tenant_charged: boolean });
      }
      return createExpense(payload);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ["expenses", expense!.public_id] });
      }
      toast.success(res.data.message || (isEdit ? "খরচ আপডেট হয়েছে" : "খরচ তৈরি হয়েছে"));
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
          <DialogTitle>
            {isEdit ? "খরচ সম্পাদনা" : "নতুন খরচ"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => mutate(data))}
            className="space-y-4"
          >
            <FormSearchSelect
              form={form}
              name="category_public_id"
              label="ক্যাটাগরি"
              isRequired
              emptyMessage="কোনো ক্যাটাগরি নেই — খরচ → ক্যাটাগরি ট্যাবে গিয়ে তৈরি করুন।"
              fetcher={async () => {
                const res = await getExpenseCategories({ page: 1, page_size: 100 });
                return (res.data.data ?? []).map((c: { public_id: string; name: string }) => ({
                  value: c.public_id,
                  label: c.name,
                }));
              }}
            />

            <FormSearchSelect
              form={form}
              name="building_public_id"
              label="বিল্ডিং"
              placeholder="সকল বিল্ডিং (ঐচ্ছিক)"
              fetcher={async () => {
                const res = await getBuildings({ page: 1, page_size: 100 });
                return (res.data.data ?? []).map((b: { public_id: string; name: string }) => ({
                  value: b.public_id,
                  label: b.name,
                }));
              }}
            />

            {buildingId && (
              <FormSearchSelect
                form={form}
                name="apartment_public_id"
                label="অ্যাপার্টমেন্ট"
                placeholder="অ্যাপার্টমেন্ট বেছে নিন (ঐচ্ছিক)"
                fetcher={async () => {
                  const res = await getApartments(buildingId, { page: 1, page_size: 100 });
                  return (res.data.data ?? []).map(
                    (a: { public_id: string; unit_number: string }) => ({
                      value: a.public_id,
                      label: `ইউনিট ${a.unit_number}`,
                    }),
                  );
                }}
              />
            )}

            <FormInput
              form={form}
              name="description"
              label="বিবরণ"
              isRequired
              placeholder="খরচের বিবরণ..."
            />

            <FormInput
              form={form}
              name="amount"
              label="পরিমাণ (৳)"
              isRequired
              type="number"
              placeholder="0"
            />

            <FormInput
              form={form}
              name="expense_date"
              label="তারিখ"
              isRequired
              type="date"
            />

            <FormField
              control={form.control}
              name="is_tenant_charged"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0 cursor-pointer">
                    ভাড়াটের উপর চার্জ হবে
                  </FormLabel>
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
                {isEdit ? "আপডেট করুন" : "তৈরি করুন"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
