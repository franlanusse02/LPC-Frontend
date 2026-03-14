"use client";

import { Trash2 } from "lucide-react";
import { MEDIOS_PAGO } from "@/lib/constants";
import { FormField } from "@/components/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface PaymentLine {
  medioPago: string;
  monto: string;
}

interface PaymentLineRowProps {
  line: PaymentLine;
  index: number;
  onUpdate: (index: number, field: keyof PaymentLine, value: string) => void;
  onRemove: (index: number) => void;
}

export function PaymentLineRow({
  line,
  index,
  onUpdate,
  onRemove,
}: PaymentLineRowProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end">
      <div className="flex-1">
        <FormField label="Medio de Pago">
          <Select
            value={line.medioPago}
            onValueChange={(value) => onUpdate(index, "medioPago", value)}
          >
            <SelectTrigger className="w-full bg-card">
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(MEDIOS_PAGO).map((key) => (
                <SelectItem
                  key={key}
                  value={MEDIOS_PAGO[key as keyof typeof MEDIOS_PAGO]}
                >
                  {key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <div className="flex-1">
        <FormField label="Monto">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={line.monto}
            onChange={(e) => onUpdate(index, "monto", e.target.value)}
            className="bg-card"
            placeholder="0.00"
          />
        </FormField>
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onRemove(index)}
        aria-label="Eliminar línea"
        className="h-9 w-9 shrink-0 self-start border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground md:self-auto"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
