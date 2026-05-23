import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fmtCurrency } from "@/lib/utils";
import type { ProductoResponse } from "@/domain/dto/consumo/ProductoResponse";

export interface ProductoLine {
  productoId: string;
  cantidad: string;
}

interface Props {
  line: ProductoLine;
  productos: ProductoResponse[];
  usedProductoIds: string[];
  onChange: (line: ProductoLine) => void;
  onRemove: () => void;
}

export function ProductoLineRow({ line, productos, usedProductoIds, onChange, onRemove }: Props) {
  const available = productos.filter(
    (p) => !usedProductoIds.includes(String(p.productoId)) || String(p.productoId) === line.productoId,
  );
  const selected = productos.find((p) => String(p.productoId) === line.productoId);
  const subtotal = selected && line.cantidad ? selected.precio * Number(line.cantidad) : null;

  return (
    <div className="flex gap-3 items-center">
      <Select
        value={line.productoId}
        onValueChange={(v) => onChange({ ...line, productoId: v })}
      >
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Producto..." />
        </SelectTrigger>
        <SelectContent>
          {available.map((p) => (
            <SelectItem key={p.productoId} value={String(p.productoId)}>
              {p.nombre} — {fmtCurrency(p.precio)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="number"
        min="1"
        step="1"
        value={line.cantidad}
        onChange={(e) => onChange({ ...line, cantidad: e.target.value })}
        placeholder="Cant."
        className="w-24"
      />

      <span className="w-24 text-right text-sm font-mono text-gray-600">
        {subtotal !== null ? fmtCurrency(subtotal) : "—"}
      </span>

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
