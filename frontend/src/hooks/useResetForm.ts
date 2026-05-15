import { useEffect, type RefObject } from "react";
import type { UseFormReturn, FieldValues } from "react-hook-form";

interface ResetRef {
  reset: () => void;
}

export function useResetForm<T extends FieldValues>({
  form,
  formRef,
}: {
  form: UseFormReturn<T>;
  formRef: RefObject<ResetRef | null>;
}) {
  useEffect(() => {
    if (formRef) {
      formRef.current = { reset: () => form.reset() };
    }
  }, [form, formRef]);
}
