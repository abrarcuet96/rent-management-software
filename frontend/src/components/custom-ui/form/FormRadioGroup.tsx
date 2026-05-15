import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

interface Option {
  value: string;
  label: string;
}

interface FormRadioGroupProps<T extends FieldValues> {
  name: Path<T>;
  form: UseFormReturn<T>;
  label: string;
  options: Option[];
}

export default function FormRadioGroup<T extends FieldValues>({
  name,
  form,
  label,
  options,
}: FormRadioGroupProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value as string}
              className="flex flex-wrap gap-4"
            >
              {options.map((opt) => (
                <div key={opt.value} className="flex items-center gap-2">
                  <RadioGroupItem value={opt.value} id={`${name}-${opt.value}`} />
                  <label
                    htmlFor={`${name}-${opt.value}`}
                    className="text-sm cursor-pointer"
                  >
                    {opt.label}
                  </label>
                </div>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
