import { generateDue } from "@/api/dues.api";
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
import { dueSchema, type DueInput } from "@/lib/validators/due";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

interface GenerateMonthlyDueProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
}

export default function GenerateMonthlyDue({ open, onOpenChange, tenantId }: GenerateMonthlyDueProps) {
  const queryClient = useQueryClient();

  const form = useForm<DueInput>({
    resolver: zodResolver(dueSchema),
    defaultValues: {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      due_date: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: DueInput) =>
      generateDue(tenantId, {
        month: data.month,
        year: data.year,
        due_date: data.due_date || undefined,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["dues", tenantId] });
      toast.success(res.data.message || "ডিউ তৈরি হয়েছে");
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
          <DialogTitle>মাসিক ডিউ তৈরি করুন</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => mutate(data))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>মাস <span className="text-danger">*</span></FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1-12" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>সাল <span className="text-danger">*</span></FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="2024" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ডিউ তারিখ (ঐচ্ছিক)</FormLabel>
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
                তৈরি করুন
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
