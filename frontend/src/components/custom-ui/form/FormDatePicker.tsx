import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, isValid, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

interface FormDatePickerProps<T extends FieldValues> {
  label?: string;
  description?: string;
  form: UseFormReturn<T>;
  name: Path<T>;
  placeholder?: string;
  isRequired?: boolean;
  labelIcon?: React.ReactNode;
  mode?: "start" | "end";
}

const FormDatePicker = <T extends FieldValues>({
  name,
  form,
  labelIcon,
  label,
  isRequired,
  description,
  placeholder,
}: FormDatePickerProps<T>) => {
  const [open, setOpen] = useState(false);

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const parsed = field.value
          ? parse(field.value as string, "yyyy-MM-dd", new Date())
          : undefined;
        const dateValue = parsed && isValid(parsed) ? parsed : undefined;

        return (
          <FormItem className="flex flex-col">
            <FormLabel>
              {labelIcon && labelIcon}
              <p className="flex justify-start items-start gap-1">
                <span>{label}</span>
                {isRequired && (
                  <span className="text-danger font-semibold">*</span>
                )}
              </p>
            </FormLabel>
            <Popover open={open} onOpenChange={setOpen} modal={true}>
              <PopoverTrigger className="w-full">
                <FormControl>
                  <Button
                    variant="outline"
                    type="button"
                    className={cn(
                      "text-left font-normal w-full",
                      !field.value && "text-muted-foreground",
                    )}
                  >
                    {dateValue ? (
                      format(dateValue, "PPP")
                    ) : (
                      <span>{placeholder ?? "তারিখ বেছে নিন"}</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateValue}
                  onSelect={(date) => {
                    if (!date) {
                      field.onChange("");
                      setOpen(false);
                      return;
                    }
                    field.onChange(format(date, "yyyy-MM-dd"));
                    setOpen(false);
                  }}
                  className=""
                />
              </PopoverContent>
            </Popover>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};

export default FormDatePicker;
