import { Input } from "@/components/ui/input";
import { fmtCurrency } from "@/lib/utils";
import type { ProductoResponse } from "@/domain/dto/consumo/ProductoResponse";

export interface ProductoLine {
  productoId: string;
  cantidad: string;
}

interface Props {
  producto: ProductoResponse;
  cantidad: string;
  onChange: (cantidad: string) => void;
}

export function ProductoLineRow({ producto, cantidad, onChange }: Props) {
  const qty = Number(cantidad) || 0;
  const subtotal = producto.precio * qty;

  return (
    <tr className="border-b last:border-0">
      <td className="py-2 pr-3 text-sm">{producto.nombre}</td>
      <td className="py-2 px-3 text-right text-sm font-mono text-gray-600">
        {fmtCurrency(producto.precio)}
      </td>
      <td className="py-2 px-3">
        <Input
          type="number"
          min="0"
          step="1"
          value={cantidad}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 text-right"
        />
      </td>
      <td className="py-2 pl-3 text-right text-sm font-mono text-gray-700">
        {subtotal > 0 ? fmtCurrency(subtotal) : "—"}
      </td>
    </tr>
  );
}
