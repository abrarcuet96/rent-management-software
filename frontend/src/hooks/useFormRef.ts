import { useRef } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

export function useFormRef<T extends FieldValues>() {
  return useRef<UseFormReturn<T> | null>(null);
}
