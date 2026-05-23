import { Trash2, Ban } from "lucide-react";
import { MediosPagoDict } from "@/domain/enums/MedioPago";
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
  id: number | null;
  medioPago: string;
  monto: string | number;
  anulacionId: number | null;
}

interface Props {
  line: PaymentLine;
  index: number;
  usedMedios: string[];
  onChange: (line: PaymentLine) => void;
  onRemove: () => void;
  onAnular?: () => void;
}

const medioLabel = (value: string) =>
  Object.entries(MediosPagoDict).find(([, v]) => v === value)?.[0] ?? value;

export function PaymentLineRow({
  line,
  usedMedios,
  onChange,
  onRemove,
  onAnular,
}: Props) {
  // Anulado - read only
  if (line.anulacionId !== null) {
    return (
      <div className="flex gap-3 opacity-50">
        <Input
          readOnly
          value={medioLabel(line.medioPago)}
          className="flex-1 bg-muted line-through"
        />
        <Input
          readOnly
          value={line.monto}
          className="flex-1 bg-muted line-through"
        />
        <div className="flex w-9 items-center justify-center">
          <span className="text-xs text-destructive">Anulado</span>
        </div>
      </div>
    );
  }

  // Persisted - read only, can anulate
  if (line.id !== null) {
    return (
      <div className="flex gap-3">
        <Input
          readOnly
          value={medioLabel(line.medioPago)}
          className="flex-1 bg-muted"
        />
        <Input readOnly value={line.monto} className="flex-1 bg-muted" />
        {onAnular ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onAnular}
            className="h-9 w-9 shrink-0 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            title="Anular movimiento"
          >
            <Ban className="h-4 w-4" />
          </Button>
        ) : (
          <div className="w-9" />
        )}
      </div>
    );
  }

  // New line - editable
  const availableMedios = Object.entries(MediosPagoDict).filter(
    ([, value]) => !usedMedios.includes(value) || value === line.medioPago,
  );

  return (
    <div className="flex gap-3">
      <Select
        value={line.medioPago}
        onValueChange={(v) => onChange({ ...line, medioPago: v })}
      >
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Medio de pago" />
        </SelectTrigger>
        <SelectContent>
          {availableMedios.map(([key, value]) => (
            <SelectItem key={key} value={value}>
              {key}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="number"
        min="0"
        step="0.01"
        value={line.monto}
        onChange={(e) => onChange({ ...line, monto: e.target.value })}
        placeholder="0.00"
        className="flex-1"
      />

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onRemove}
        className="h-9 w-9 shrink-0 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
