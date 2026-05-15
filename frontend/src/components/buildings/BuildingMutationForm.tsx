import FormInput from "@/components/custom-ui/form/FormInput";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { buildingSchema, type BuildingInput } from "@/lib/validators/building";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import type { RefObject } from "react";
import { useForm } from "react-hook-form";

interface BuildingMutationFormProps {
  onSubmit: (data: BuildingInput) => void;
  isPending: boolean;
  defaultValues?: Partial<BuildingInput>;
  formRef?: RefObject<{ reset: () => void } | null>;
  mode?: "create" | "edit";
}

export default function BuildingMutationForm({
  onSubmit,
  isPending,
  defaultValues,
  formRef,
  mode = "create",
}: BuildingMutationFormProps) {
  const form = useForm<BuildingInput>({
    resolver: zodResolver(buildingSchema),
    defaultValues: { name: "", address: "", total_floors: 1, ...defaultValues },
  });

  if (formRef) {
    formRef.current = { reset: () => form.reset() };
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormInput form={form} name="name" label="নাম" isRequired placeholder="বিল্ডিং এর নাম" />
        <FormInput form={form} name="address" label="ঠিকানা" isRequired placeholder="সম্পূর্ণ ঠিকানা" />
        <FormInput
          form={form}
          name="total_floors"
          label="মোট তলা"
          isRequired
          type="number"
          placeholder="তলার সংখ্যা"
        />
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {isPending && <Loader2 size={16} className="animate-spin mr-1.5" />}
            {mode === "edit" ? "আপডেট করুন" : "তৈরি করুন"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
