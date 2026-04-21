import { cn, fmtCurrency } from "@/lib/utils";
import { Ban } from "lucide-react";
import { useState } from "react";
import { SortIcon } from "@/components/data-table";
import type { MovimientoResponse } from "@/domain/dto/movimiento/MovimientoResponse";

export function MovimientoRow({ mov }: { mov: MovimientoResponse }) {
  const isAnulado = !!mov.anulacionId;
  return (
    <tr
      className={cn(
        "transition-colors",
        isAnulado ? "opacity-40" : "hover:bg-white",
      )}
    >
      <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
        {mov.fechaHora}
      </td>
      <td className="px-4 py-2.5 font-medium">{mov.medioPago}</td>
      <td className="px-4 py-2.5 text-right font-mono">
        {fmtCurrency(mov.monto)}
      </td>
      <td className="px-4 py-2.5 text-center">
        {isAnulado ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-500">
            <Ban className="h-2.5 w-2.5" />
            Anulado
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            Activo
          </span>
        )}
      </td>
      <td className="px-4 py-2.5 text-gray-500">
        {mov.comentarios || <span className="text-gray-300">—</span>}
      </td>
    </tr>
  );
}

export function AnuladosGroup({ movimientos }: { movimientos: MovimientoResponse[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr className="bg-gray-50/80">
        <td colSpan={5} className="px-4 py-2">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <SortIcon active dir={open ? "asc" : "desc"} />
            {open ? "Ocultar" : "Mostrar"} anulados ({movimientos.length})
          </button>
        </td>
      </tr>
      {open && movimientos.map((mov) => <MovimientoRow key={mov.id} mov={mov} />)}
    </>
  );
}
