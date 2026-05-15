import FormInput from "@/components/custom-ui/form/FormInput";
import FormStaticSelect from "@/components/custom-ui/form/FormStaticSelect";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { apartmentSchema, type ApartmentInput } from "@/lib/validators/apartment";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import type { RefObject } from "react";
import { useForm } from "react-hook-form";

interface ApartmentMutationFormProps {
  onSubmit: (data: ApartmentInput) => void;
  isPending: boolean;
  defaultValues?: Partial<ApartmentInput>;
  formRef?: RefObject<{ reset: () => void } | null>;
  mode?: "create" | "edit";
}

export default function ApartmentMutationForm({
  onSubmit,
  isPending,
  defaultValues,
  formRef,
  mode = "create",
}: ApartmentMutationFormProps) {
  const form = useForm<ApartmentInput>({
    resolver: zodResolver(apartmentSchema),
    defaultValues: { unit_number: "", floor: 1, status: "vacant", ...defaultValues },
  });

  if (formRef) {
    formRef.current = { reset: () => form.reset() };
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormInput
          form={form}
          name="unit_number"
          label="ইউনিট নম্বর"
          isRequired
          placeholder="যেমন: 101"
        />
        <FormInput
          form={form}
          name="floor"
          label="তলা"
          isRequired
          type="number"
          placeholder="তলা নম্বর"
        />
        {mode === "edit" && (
          <FormStaticSelect
            form={form}
            name="status"
            label="অবস্থা"
            options={[
              { value: "vacant", label: "খালি" },
              { value: "occupied", label: "ভর্তি" },
            ]}
          />
        )}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={isPending}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isPending && <Loader2 size={16} className="animate-spin mr-1.5" />}
            {mode === "edit" ? "আপডেট করুন" : "তৈরি করুন"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
