import { createExpenseCategory } from "@/api/expenses.api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import FormInput from "@/components/custom-ui/form/FormInput";
import { getFallback } from "@/lib/getFallback";
import {
  expenseCategorySchema,
  type ExpenseCategoryInput,
} from "@/lib/validators/expense";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateCategoryDialog({
  open,
  onOpenChange,
}: CreateCategoryDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<ExpenseCategoryInput>({
    resolver: zodResolver(expenseCategorySchema),
    defaultValues: { name: "" },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: ExpenseCategoryInput) => createExpenseCategory(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      toast.success(res.data.message || "ক্যাটাগরি তৈরি হয়েছে");
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
          <DialogTitle>নতুন ক্যাটাগরি</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => mutate(data))}
            className="space-y-4"
          >
            <FormInput
              form={form}
              name="name"
              label="ক্যাটাগরির নাম"
              isRequired
              placeholder="যেমন: রং এর খরচ, ইলেকট্রিক বিল..."
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
