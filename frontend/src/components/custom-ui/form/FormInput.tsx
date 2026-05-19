import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type {
  Control,
  FieldValues,
  Path,
  UseFormReturn,
} from "react-hook-form";

interface FormInputProps<T extends FieldValues> {
  name: Path<T>;
  form: UseFormReturn<T>;
  label: string;
  isRequired?: boolean;
  type?: string;
  placeholder?: string;
  description?: string;
  autoComplete?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function FormInput<T extends FieldValues>({
  name,
  form,
  label,
  isRequired,
  type = "text",
  placeholder,
  description,
  autoComplete,
  onChange,
}: FormInputProps<T>) {
  return (
    <FormField
      control={form.control as unknown as Control<FieldValues>}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {isRequired && <span className="text-danger ml-0.5">*</span>}
          </FormLabel>
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              autoComplete={autoComplete}
              {...field}
              {...(onChange
                ? { onChange, value: (field.value as string | number) ?? "" }
                : {})}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
