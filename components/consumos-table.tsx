"use client";

import { useMemo, useState } from "react";
import {
  Ban,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Eye,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ConsumoListItem } from "@/lib/consumos";

export type ConsumoSortKey =
  | "fecha"
  | "comedor"
  | "puntoDeVenta"
  | "consumidor"
  | "total";
export type ConsumoSortDir = "asc" | "desc";
export type ConsumoStatusFilter = "all" | "active" | "anulado";

const statusLabel: Record<ConsumoStatusFilter, string> = {
  all: "Todos",
  active: "Activos",
  anulado: "Anulados",
};

function SortIcon({
  col,
  sortKey,
  sortDir,
}: {
  col: ConsumoSortKey;
  sortKey: ConsumoSortKey;
  sortDir: ConsumoSortDir;
}) {
  if (col !== sortKey) {
    return <ChevronsUpDown className="ml-1 inline h-3 w-3 opacity-30" />;
  }

  return sortDir === "asc" ? (
    <ChevronUp className="ml-1 inline h-3 w-3 text-primary" />
  ) : (
    <ChevronDown className="ml-1 inline h-3 w-3 text-primary" />
  );
}

export interface ConsumosTableProps {
  consumos: ConsumoListItem[];
  displayedConsumos?: ConsumoListItem[];
  loading: boolean;
  readonly?: boolean;
  hideToolbar?: boolean;
  search?: string;
  onSearchChange?: (value: string) => void;
  statusFilter?: ConsumoStatusFilter;
  onStatusFilterChange?: (value: ConsumoStatusFilter) => void;
  sortKey?: ConsumoSortKey;
  sortDir?: ConsumoSortDir;
  onSort?: (key: ConsumoSortKey) => void;
  onNuevoConsumo?: () => void;
  onEditar?: (consumo: ConsumoListItem) => void;
  onAnular?: (consumo: ConsumoListItem) => void;
  onClearFilters: () => void;
}

export function ConsumosTable({
  consumos,
  displayedConsumos,
  loading,
  readonly = false,
  hideToolbar = false,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortKey,
  sortDir,
  onSort,
  onNuevoConsumo,
  onEditar,
  onAnular,
  onClearFilters,
}: ConsumosTableProps) {
  const [localSearch, setLocalSearch] = useState("");
  const [localStatusFilter, setLocalStatusFilter] =
    useState<ConsumoStatusFilter>("active");
  const [localSortKey, setLocalSortKey] = useState<ConsumoSortKey>("fecha");
  const [localSortDir, setLocalSortDir] = useState<ConsumoSortDir>("desc");
  const [detailTarget, setDetailTarget] = useState<ConsumoListItem | null>(null);

  const activeSearch = search ?? localSearch;
  const activeStatusFilter = statusFilter ?? localStatusFilter;
  const activeSortKey = sortKey ?? localSortKey;
  const activeSortDir = sortDir ?? localSortDir;
  const setSearchValue = onSearchChange ?? setLocalSearch;
  const setStatusFilterValue = onStatusFilterChange ?? setLocalStatusFilter;

  const displayed = useMemo(() => {
    if (displayedConsumos) return displayedConsumos;

    const query = activeSearch.trim().toLowerCase();
    const next = [...consumos].filter((consumo) => {
      if (activeStatusFilter === "active" && consumo.anulado) return false;
      if (activeStatusFilter === "anulado" && !consumo.anulado) return false;
      if (!query) return true;

      return (
        consumo.fecha.includes(query) ||
        consumo.comedorNombre.toLowerCase().includes(query) ||
        consumo.puntoDeVentaNombre.toLowerCase().includes(query) ||
        consumo.consumidorNombre.toLowerCase().includes(query) ||
        (consumo.observaciones ?? "").toLowerCase().includes(query)
      );
    });

    next.sort((left, right) => {
      let leftValue: string | number = "";
      let rightValue: string | number = "";

      if (activeSortKey === "fecha") {
        leftValue = left.fecha;
        rightValue = right.fecha;
      }
      if (activeSortKey === "comedor") {
        leftValue = left.comedorNombre;
        rightValue = right.comedorNombre;
      }
      if (activeSortKey === "puntoDeVenta") {
        leftValue = left.puntoDeVentaNombre;
        rightValue = right.puntoDeVentaNombre;
      }
      if (activeSortKey === "consumidor") {
        leftValue = left.consumidorNombre;
        rightValue = right.consumidorNombre;
      }
      if (activeSortKey === "total") {
        leftValue = left.total;
        rightValue = right.total;
      }

      if (leftValue < rightValue) return activeSortDir === "asc" ? -1 : 1;
      if (leftValue > rightValue) return activeSortDir === "asc" ? 1 : -1;
      return 0;
    });

    return next;
  }, [
    activeSearch,
    activeSortDir,
    activeSortKey,
    activeStatusFilter,
    consumos,
    displayedConsumos,
  ]);

  const hasActiveFilters =
    activeSearch.trim().length > 0 || activeStatusFilter !== "active";

  const handleSort = (key: ConsumoSortKey) => {
    if (onSort) {
      onSort(key);
      return;
    }

    if (key === activeSortKey) {
      setLocalSortDir((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setLocalSortKey(key);
      setLocalSortDir("asc");
    }
  };

  const sortableTh = (label: string, key: ConsumoSortKey, className?: string) => (
    <th
      className={cn(
        "cursor-pointer select-none whitespace-nowrap px-4 py-3 transition-colors hover:text-gray-700",
        className,
      )}
      onClick={() => handleSort(key)}
    >
      {label}
      <SortIcon col={key} sortKey={activeSortKey} sortDir={activeSortDir} />
    </th>
  );

  return (
    <>
      {!hideToolbar && (
        <div className="border-b px-6 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <Input
                value={activeSearch}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Buscar por consumidor o punto de venta..."
                className="h-8 w-60 bg-gray-50 pl-8 text-sm border-gray-200"
              />
              {activeSearch && (
                <button
                  onClick={() => setSearchValue("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
              {(["all", "active", "anulado"] as ConsumoStatusFilter[]).map(
                (item) => (
                  <button
                    key={item}
                    onClick={() => setStatusFilterValue(item)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                      activeStatusFilter === item
                        ? "bg-white shadow-sm text-gray-900"
                        : "text-gray-500 hover:text-gray-700",
                    )}
                  >
                    {statusLabel[item]}
                  </button>
                ),
              )}
            </div>

            {onNuevoConsumo && (
              <Button
                onClick={onNuevoConsumo}
                size="sm"
                className="ml-auto gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-wide transition hover:scale-105"
              >
                <Plus className="h-4 w-4" />
                Nuevo Consumo
              </Button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
          <SlidersHorizontal className="h-8 w-8 opacity-40" />
          <p className="text-sm">
            {consumos.length === 0
              ? "No hay consumos registrados"
              : "Ningún consumo coincide con los filtros"}
          </p>
          {consumos.length > 0 && (
            <button
              onClick={onClearFilters}
              className="text-xs text-primary underline-offset-2 hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="border-b bg-gray-50/60 px-6 py-2">
            <p className="text-xs text-gray-400">
              {displayed.length} resultado{displayed.length !== 1 ? "s" : ""}
              {hasActiveFilters && (
                <button
                  onClick={onClearFilters}
                  className="ml-2 text-primary underline-offset-2 hover:underline"
                >
                  Limpiar filtros
                </button>
              )}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100/80 text-left text-xs uppercase tracking-wider text-gray-500">
                  {sortableTh("Fecha", "fecha")}
                  {sortableTh("Comedor", "comedor")}
                  {sortableTh("Punto de Venta", "puntoDeVenta")}
                  {sortableTh("Consumidor", "consumidor")}
                  <th className="px-4 py-3">Productos</th>
                  {sortableTh("Total", "total", "text-right")}
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3">Observaciones</th>
                  <th className="w-24 px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((consumo) => (
                  <tr
                    key={consumo.id}
                    className={cn(
                      "border-b transition-colors",
                      consumo.anulado
                        ? "bg-red-50/30 text-gray-400"
                        : "hover:bg-gray-50/80",
                    )}
                  >
                    <td className="px-4 py-4 font-medium whitespace-nowrap">
                      {consumo.fecha}
                    </td>
                    <td className="px-4 py-4">{consumo.comedorNombre}</td>
                    <td className="px-4 py-4">{consumo.puntoDeVentaNombre}</td>
                    <td className="px-4 py-4">
                      <div className="font-medium">{consumo.consumidorNombre}</div>
                      <div className="text-xs text-gray-400">
                        {consumo.consumidorTaxId ?? "Sin DNI"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {consumo.productos
                        .map(
                          (item) => `${item.producto.nombre} x${item.cantidad}`,
                        )
                        .join(", ")}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {new Intl.NumberFormat("es-AR", {
                        style: "currency",
                        currency: "ARS",
                        minimumFractionDigits: 0,
                      }).format(consumo.total)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          consumo.anulado
                            ? "bg-red-100 text-red-600"
                            : "bg-emerald-100 text-emerald-700",
                        )}
                      >
                        {consumo.anulado ? (
                          <Ban className="h-3 w-3" />
                        ) : null}
                        {consumo.anulado ? "Anulado" : "Activo"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {consumo.observaciones?.trim() || "—"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-1">
                        {!readonly && !consumo.anulado && onEditar && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditar(consumo)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {!readonly && !consumo.anulado && onAnular && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onAnular(consumo)}
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                        {consumo.anulado && consumo.anulacion && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDetailTarget(consumo)}
                            className="h-8 w-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {detailTarget?.anulacion && (
        <Dialog
          open={!!detailTarget}
          onOpenChange={(value) => !value && setDetailTarget(null)}
        >
          <DialogContent className="sm:max-w-lg overflow-hidden border-0 p-0 shadow-xl">
            <div className="h-1.5 w-full bg-red-500" />
            <div className="space-y-4 px-6 pb-6 pt-5">
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-lg font-bold text-gray-900">
                  Detalle de anulación
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  Consumo del {detailTarget.fecha} para{" "}
                  {detailTarget.consumidorNombre}.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <strong>Anulado por:</strong>{" "}
                  {detailTarget.anulacion.anuladoPor.nombre}
                </p>
                <p>
                  <strong>Fecha de anulación:</strong>{" "}
                  {detailTarget.anulacion.fechaAnulacion}
                </p>
                <p>
                  <strong>Motivo:</strong>{" "}
                  {detailTarget.anulacion.motivoAnulacion}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
