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
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  Control,
  FieldValues,
  Path,
  UseFormReturn,
} from "react-hook-form";

interface Option {
  value: string;
  label: string;
}

interface FormSearchSelectProps<T extends FieldValues> {
  name: Path<T>;
  form: UseFormReturn<T>;
  label: string;
  fetcher: () => Promise<Option[]>;
  isRequired?: boolean;
  placeholder?: string;
  disabled?: boolean;
  emptyMessage?: string;
}

export default function FormSearchSelect<T extends FieldValues>({
  name,
  form,
  label,
  fetcher,
  isRequired,
  placeholder = "বেছে নিন",
  disabled,
  emptyMessage,
}: FormSearchSelectProps<T>) {
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetcher()
      .then((data) => {
        if (!cancelled) {
          setOptions(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
          <Select
            onValueChange={field.onChange}
            value={field.value as string}
            disabled={disabled || loading}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loading ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 size={14} className="animate-spin" />
                        লোড হচ্ছে...
                      </span>
                    ) : (
                      placeholder
                    )
                  }
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {!loading && options.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-text-secondary">
                  {emptyMessage ?? "কোনো ডেটা পাওয়া যায়নি"}
                </div>
              ) : (
                options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
