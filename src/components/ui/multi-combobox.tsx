import * as React from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { CheckIcon, ChevronsUpDownIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { ComboboxOption } from "@/components/ui/combobox";
import { useStopWheelPropagation } from "@/components/ui/use-stop-wheel-propagation";

interface MultiComboboxProps {
  options: ComboboxOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
}

function MultiCombobox({
  options,
  values,
  onChange,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  disabled = false,
  clearable = false,
  className,
}: MultiComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const searchRef = React.useRef<HTMLInputElement>(null);
  const listboxId = React.useId();
  const listRef = useStopWheelPropagation<HTMLDivElement>();

  const selectedSet = React.useMemo(() => new Set(values), [values]);

  const displayLabel = React.useMemo(() => {
    if (values.length === 0) return undefined;
    if (values.length === 1) {
      return options.find((o) => o.value === values[0])?.label ?? values[0];
    }
    return `${values.length} seleccionados`;
  }, [values, options]);

  const filtered = React.useMemo(() => {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.subtitle && o.subtitle.toLowerCase().includes(q)),
    );
  }, [options, search]);

  const toggle = (value: string) => {
    if (selectedSet.has(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch("");
      }}
    >
      <PopoverPrimitive.Trigger asChild disabled={disabled}>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          className={cn(
            "flex w-fit items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 h-8",
            className,
          )}
        >
          <span className={cn("truncate", !displayLabel && "text-muted-foreground")}>
            {displayLabel ?? placeholder}
          </span>
          <span className="flex items-center gap-0.5">
            {clearable && values.length > 0 && (
              <XIcon
                className="size-3.5 text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange([]);
                }}
              />
            )}
            <ChevronsUpDownIcon className="size-4 text-muted-foreground" />
          </span>
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-50 rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 overflow-hidden animate-in fade-in-0 zoom-in-95"
          style={{ width: "var(--radix-popover-trigger-width)" }}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            searchRef.current?.focus();
          }}
        >
          <div className="p-1.5">
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-7 text-sm"
            />
          </div>
          <div ref={listRef} id={listboxId} role="listbox" className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Sin resultados
              </div>
            ) : (
              filtered.map((option) => {
                const isSelected = selectedSet.has(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={cn(
                      "relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1.5 pr-8 pl-1.5 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground",
                      isSelected && "bg-accent/50",
                    )}
                    onClick={() => toggle(option.value)}
                  >
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      {option.subtitle && (
                        <span className="text-xs text-muted-foreground">
                          {option.subtitle}
                        </span>
                      )}
                    </div>
                    {isSelected && <CheckIcon className="absolute right-2 size-4" />}
                  </button>
                );
              })
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export { MultiCombobox };
