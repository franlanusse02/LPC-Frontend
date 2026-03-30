"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

export function DatePickerInput({
  value,
  onChange,
  disabled = false,
  placeholder = "dd/mm/yyyy",
  className,
}: DatePickerInputProps) {
  const [open, setOpen] = useState(false);

  const selectedDate = useMemo(() => {
    if (!value) return undefined;
    try {
      return parseISO(value);
    } catch {
      return undefined;
    }
  }, [value]);

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "h-10 w-full justify-between rounded-md border border-gray-200 bg-white px-3 text-left font-normal text-sm shadow-none hover:bg-white",
              !value && "text-muted-foreground",
              className,
            )}
          >
            <span>
              {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: es }) : placeholder}
            </span>
            <CalendarIcon className="h-4 w-4 text-gray-500" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="z-[80] w-auto p-0" align="start">
          <Calendar
            mode="single"
            locale={es}
            selected={selectedDate}
            onSelect={(date) => {
              if (!date) return;
              onChange(format(date, "yyyy-MM-dd"));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>

      {value && !disabled && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-9 top-1/2 -translate-y-1/2 rounded-sm p-1 text-gray-400 hover:text-gray-600"
          aria-label="Limpiar fecha"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
