"use client";

import { AssignmentBadge } from "@/components/assignment-badge";
import { RowStatusBadge } from "@/components/row-status-badge";
import { Button } from "@/components/ui/button";
import { ImportRowFacturaResponse } from "@/models/dto/imports/facturas/ImportRowFacturaResponse";
import { LockKeyhole, Pencil, UserPlus2 } from "lucide-react";

type FacturaImportRowsTableProps = {
  rows: ImportRowFacturaResponse[];
  loading: boolean;
  currentUserId?: string | number | null;
  onTake: (row: ImportRowFacturaResponse) => void;
  onOpen: (row: ImportRowFacturaResponse) => void;
};

const formatAmount = (amount: number | null) =>
  amount == null
    ? "—"
    : new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
      }).format(amount);

export function FacturaImportRowsTable({
  rows,
  loading,
  currentUserId,
  onTake,
  onOpen,
}: FacturaImportRowsTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
        <p className="text-sm">No hay filas para los filtros seleccionados.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100/80 text-left text-xs uppercase tracking-wider text-gray-500">
            <th className="px-4 py-3">Fila</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Asignación</th>
            <th className="px-4 py-3">Excel ID</th>
            <th className="px-4 py-3">Número</th>
            <th className="px-4 py-3">Proveedor</th>
            <th className="px-4 py-3">Comedor</th>
            <th className="px-4 py-3">Monto</th>
            <th className="px-4 py-3">Medio Pago</th>
            <th className="px-4 py-3">Banco</th>
            <th className="px-4 py-3">Errores</th>
            <th className="px-4 py-3 w-32" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isMine = row.asignadoAId != null && String(row.asignadoAId) === String(currentUserId);
            const canTake = row.estadoAsignacion === "SIN_ASIGNAR" && row.estado !== "APPLIED";

            return (
              <tr key={row.id} className="border-b align-top transition-colors hover:bg-gray-50/80">
                <td className="px-4 py-4 font-mono text-xs text-gray-500">{row.rowIndex}</td>
                <td className="px-4 py-4">
                  <RowStatusBadge estado={row.estado} />
                </td>
                <td className="px-4 py-4">
                  <AssignmentBadge
                    estadoAsignacion={row.estadoAsignacion}
                    asignadoANombre={row.asignadoANombre}
                    mine={isMine}
                  />
                </td>
                <td className="px-4 py-4 font-medium text-gray-800">{row.excelId ?? "—"}</td>
                <td className="px-4 py-4 font-mono text-xs">{row.numeroFactura ?? "—"}</td>
                <td className="px-4 py-4">{row.proveedorNombre ?? row.proveedorId ?? "—"}</td>
                <td className="px-4 py-4">{row.comedorNombre ?? row.comedorId ?? "—"}</td>
                <td className="px-4 py-4 font-mono">{formatAmount(row.monto)}</td>
                <td className="px-4 py-4">{row.medioPago ?? row.formaPagoRaw ?? "—"}</td>
                <td className="px-4 py-4">{row.bancoPagadorRaw ?? "—"}</td>
                <td className="px-4 py-4 text-xs text-rose-700">
                  {row.errors ? (
                    <span className="line-clamp-3 whitespace-pre-line">{row.errors}</span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpen(row)}
                      className="gap-2 border-gray-200 text-xs"
                    >
                      {isMine ? <Pencil className="h-3.5 w-3.5" /> : <LockKeyhole className="h-3.5 w-3.5" />}
                      {isMine ? "Editar" : "Ver"}
                    </Button>
                    {canTake && (
                      <Button
                        size="sm"
                        onClick={() => onTake(row)}
                        className="gap-2 text-xs"
                      >
                        <UserPlus2 className="h-3.5 w-3.5" />
                        Tomar
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
