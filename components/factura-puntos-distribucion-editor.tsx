"use client";

import { useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  autoAdjustFacturaDistribucionRows,
  FacturaPuntoDeVentaDistribucionRow,
  facturaDistribucionTotal,
  rebalanceFacturaDistribucionRows,
} from "@/lib/facturas";
import { PuntoDeVentaResponse } from "@/models/dto/pto-venta/PuntoDeVentaResponse";

interface FacturaPuntosDistribucionEditorProps {
  rows: FacturaPuntoDeVentaDistribucionRow[];
  puntosDeVenta: PuntoDeVentaResponse[];
  onChange: (rows: FacturaPuntoDeVentaDistribucionRow[]) => void;
  facturaMonto: string | number;
  error?: string | null;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

export function FacturaPuntosDistribucionEditor({
  rows,
  puntosDeVenta,
  onChange,
  facturaMonto,
  error,
}: FacturaPuntosDistribucionEditorProps) {
  const total = facturaDistribucionTotal(rows);
  const isAddDisabled = puntosDeVenta.length === 0 || rows.length >= puntosDeVenta.length;
  const montoFactura = Number(typeof facturaMonto === "string" ? facturaMonto.replace(",", ".") : facturaMonto);
  const totalMatchesFactura = Number.isFinite(montoFactura) && montoFactura > 0
    ? Math.round(total * 100) === Math.round(montoFactura * 100)
    : false;

  const baseOptions = useMemo(() => {
    const byId = new Map(
      puntosDeVenta.map((puntoDeVenta) => [
        String(puntoDeVenta.id),
        { value: String(puntoDeVenta.id), label: puntoDeVenta.nombre },
      ]),
    );

    for (const row of rows) {
      if (!row.puntoDeVentaId || byId.has(row.puntoDeVentaId)) continue;
      byId.set(row.puntoDeVentaId, {
        value: row.puntoDeVentaId,
        label: `Punto ${row.puntoDeVentaId}`,
      });
    }

    return Array.from(byId.values()).sort((left, right) =>
      left.label.localeCompare(right.label),
    );
  }, [puntosDeVenta, rows]);

  const selectedIds = useMemo(
    () => rows.map((row) => row.puntoDeVentaId).filter(Boolean),
    [rows],
  );

  const getOptionsForRow = (row: FacturaPuntoDeVentaDistribucionRow) =>
    baseOptions.filter(
      (option) =>
        !selectedIds.includes(option.value) || option.value === row.puntoDeVentaId,
    );

  const updateRow = (
    index: number,
    field: keyof FacturaPuntoDeVentaDistribucionRow,
    value: string,
  ) => {
    if (field === "monto") {
      onChange(autoAdjustFacturaDistribucionRows(rows, facturaMonto, index, value));
      return;
    }

    onChange(
      rows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
  };

  const addRow = () => {
    if (isAddDisabled) return;
    onChange(
      rebalanceFacturaDistribucionRows(
        [...rows, { puntoDeVentaId: "", monto: "" }],
        facturaMonto,
      ),
    );
  };

  const removeRow = (index: number) => {
    onChange(
      rebalanceFacturaDistribucionRows(
        rows.filter((_, rowIndex) => rowIndex !== index),
        facturaMonto,
      ),
    );
  };

  return (
    <div className="col-span-2 rounded-xl border border-gray-200 bg-gray-50/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Distribución puntos de venta comedor *
          </h3>
          <p className="text-xs text-gray-500">
            Asigná el monto por punto de venta del comedor. La suma debe coincidir con el monto total.
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold",
            totalMatchesFactura
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700",
          )}
        >
          Total {formatCurrency(total)}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-5 text-sm text-gray-500">
            No hay puntos cargados. Agregá al menos una fila para distribuir el monto total.
          </div>
        ) : (
          rows.map((row, index) => (
            <div
              key={`${row.puntoDeVentaId || "nuevo"}-${index}`}
              className="grid grid-cols-[minmax(0,1fr)_120px_auto] items-start gap-3"
            >
              <Combobox
                options={getOptionsForRow(row)}
                value={row.puntoDeVentaId}
                onChange={(value) => updateRow(index, "puntoDeVentaId", value)}
                placeholder={
                  puntosDeVenta.length > 0
                    ? "Seleccionar punto de venta..."
                    : "Seleccioná un comedor con puntos de venta"
                }
                searchPlaceholder="Buscar punto de venta..."
                emptyText="No hay puntos de venta para este comedor."
                disabled={getOptionsForRow(row).length === 0}
                className="bg-white"
              />
              <div className="relative">
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={row.monto}
                  onChange={(event) => updateRow(index, "monto", event.target.value)}
                  placeholder="0.00"
                  className="bg-white pr-8"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  ARS
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeRow(index)}
                className="border-gray-200 bg-white text-gray-500 hover:text-red-600"
                aria-label="Eliminar fila"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          disabled={isAddDisabled}
          className="gap-2 border-gray-200 bg-white text-sm font-semibold"
        >
          <Plus className="h-4 w-4" />
          Agregar punto
        </Button>
        {error ? (
          <p className="text-sm font-medium text-red-600">{error}</p>
        ) : (
          <p className="text-xs text-gray-500">
            {rows.length >= puntosDeVenta.length && puntosDeVenta.length > 0
              ? "Ya agregaste todos los puntos disponibles."
              : `Cada punto debe aparecer una sola vez. Objetivo ${Number.isFinite(montoFactura) && montoFactura > 0 ? formatCurrency(montoFactura) : "—"}.`}
          </p>
        )}
      </div>
    </div>
  );
}
