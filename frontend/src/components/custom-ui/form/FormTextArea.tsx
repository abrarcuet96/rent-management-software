import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

interface FormTextAreaProps<T extends FieldValues> {
  name: Path<T>;
  form: UseFormReturn<T>;
  label: string;
  isRequired?: boolean;
  placeholder?: string;
  description?: string;
  rows?: number;
}

export default function FormTextArea<T extends FieldValues>({
  name,
  form,
  label,
  isRequired,
  placeholder,
  description,
  rows = 3,
}: FormTextAreaProps<T>) {
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
            <Textarea placeholder={placeholder} rows={rows} {...field} />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
