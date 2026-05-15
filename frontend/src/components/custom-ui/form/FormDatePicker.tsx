import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

interface FormDatePickerProps<T extends FieldValues> {
  name: Path<T>;
  form: UseFormReturn<T>;
  label: string;
  isRequired?: boolean;
}

export default function FormDatePicker<T extends FieldValues>({
  name,
  form,
  label,
  isRequired,
}: FormDatePickerProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {isRequired && <span className="text-danger ml-0.5">*</span>}
          </FormLabel>
          <FormControl>
            <Input type="date" {...field} value={field.value as string} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
