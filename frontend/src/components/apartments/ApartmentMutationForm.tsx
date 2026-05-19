import FormInput from "@/components/custom-ui/form/FormInput";
import FormStaticSelect from "@/components/custom-ui/form/FormStaticSelect";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import type { CREATE_APARTMENT } from "@/schemas/apartment.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { toBn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, type RefObject } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";

interface ApartmentMutationFormProps {
  onSubmit: (data: CREATE_APARTMENT) => void;
  isPending: boolean;
  totalFloors: number;
  defaultValues?: Partial<CREATE_APARTMENT>;
  formRef?: RefObject<{ reset: () => void } | null>;
  mode?: "create" | "edit";
}

export default function ApartmentMutationForm({
  onSubmit,
  isPending,
  totalFloors,
  defaultValues,
  formRef,
  mode = "create",
}: ApartmentMutationFormProps) {
  // Build schema dynamically so the max floor is always in sync with the building
  const schema = useMemo(
    () =>
      z.object({
        unit_number: z.string().min(1, "ইউনিট নম্বর প্রয়োজন"),
        floor: z.coerce
          .number({ message: "তলা নম্বর প্রয়োজন" })
          .min(1, "তলা নম্বর ন্যূনতম ১ হতে হবে")
          .max(totalFloors, `তলা নম্বর সর্বোচ্চ ${toBn(totalFloors)} হতে পারে`),
        status: z.enum(["vacant", "occupied"]).default("vacant"),
      }),
    [totalFloors],
  );

  const form = useForm<CREATE_APARTMENT>({
    resolver: zodResolver(schema) as Resolver<CREATE_APARTMENT>,
    defaultValues: {
      unit_number: "",
      floor: 1,
      status: "vacant",
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (formRef) {
      formRef.current = { reset: form.reset };
    }
  }, [formRef, form.reset]);

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
          label={`তলা (১ – ${toBn(totalFloors)})`}
          isRequired
          type="number"
          placeholder={`১ থেকে ${toBn(totalFloors)}`}
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
