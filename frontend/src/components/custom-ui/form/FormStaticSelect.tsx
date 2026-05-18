import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Control, FieldValues, Path, UseFormReturn } from "react-hook-form";

interface Option {
  value: string;
  label: string;
}

interface FormStaticSelectProps<T extends FieldValues> {
  name: Path<T>;
  form: UseFormReturn<T, any, any>;
  label: string;
  options: Option[];
  isRequired?: boolean;
  placeholder?: string;
}

export default function FormStaticSelect<T extends FieldValues>({
  name,
  form,
  label,
  options,
  isRequired,
  placeholder = "বেছে নিন",
}: FormStaticSelectProps<T>) {
  return (
    <FormField
      control={form.control as unknown as Control<any>}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {isRequired && <span className="text-danger ml-0.5">*</span>}
          </FormLabel>
          <Select onValueChange={field.onChange} value={field.value as string}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
