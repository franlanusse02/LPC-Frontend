"use client";

import { Fragment, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  MoreHorizontal,
  Ban,
  Pencil,
  Search,
  X,
  SlidersHorizontal,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DetailedCierreCajaResponse } from "@/models/dto/cierre-caja/CierreCajaResponse";
import { MovimientoResponse } from "@/models/dto/movimiento/MovimientoResponse";
import Link from "next/link";

type SortKey =
  | "fechaOperacion"
  | "comedor"
  | "creadoPor"
  | "puntoDeVenta"
  | "totalPlatosVendidos"
  | "montoTotal";
type SortDir = "asc" | "desc";
type StatusFilter = "all" | "active" | "anulado";

export interface CierresTableProps {
  cierres: DetailedCierreCajaResponse[];
  displayedCierres: DetailedCierreCajaResponse[];
  loading: boolean;
  readonly?: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (v: StatusFilter) => void;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  comedorFilter: string;
  onComedorFilterChange: (v: string) => void;
  onClearFilters: () => void;
  onEditar?: (cierreId: number) => void;
  onAnular?: (cierre: DetailedCierreCajaResponse) => void;
  onNuevoCierre?: () => void;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(amount);

function SortIcon({
  col,
  sortKey,
  sortDir,
}: {
  col: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
}) {
  if (col !== sortKey)
    return <ChevronsUpDown className="ml-1 inline h-3 w-3 opacity-30" />;
  return sortDir === "asc" ? (
    <ChevronUp className="ml-1 inline h-3 w-3 text-primary" />
  ) : (
    <ChevronDown className="ml-1 inline h-3 w-3 text-primary" />
  );
}

export function CierresTable({
  cierres,
  displayedCierres,
  loading,
  readonly = false,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortKey,
  sortDir,
  onSort,
  comedorFilter,
  onComedorFilterChange,
  onClearFilters,
  onEditar,
  onAnular,
  onNuevoCierre,
}: CierresTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const comedorOptions = useMemo(
    () => [...new Set(cierres.map((c) => c.comedor.nombre))].sort(),
    [cierres],
  );

  const hasActiveFilters =
    search || statusFilter !== "all" || comedorFilter;

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const sortableTh = (label: string, key: SortKey, className?: string) => (
    <th
      className={cn(
        "px-4 py-3 cursor-pointer select-none whitespace-nowrap hover:text-gray-700 transition-colors",
        className,
      )}
      onClick={() => onSort(key)}
    >
      {label}
      <SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
    </th>
  );

  const colSpanTotal = readonly ? 9 : 10;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 px-6 py-4 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar..."
            className="pl-8 h-8 w-48 text-sm bg-gray-50 border-gray-200"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
          {(["all", "active", "anulado"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => onStatusFilterChange(s)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                statusFilter === s
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              {s === "all" ? "Todos" : s === "active" ? "Activos" : "Anulados"}
            </button>
          ))}
        </div>

        {comedorOptions.length > 1 && (
          <select
            value={comedorFilter}
            onChange={(e) => onComedorFilterChange(e.target.value)}
            className="h-8 rounded-md border border-gray-200 bg-gray-50 px-2 text-sm text-gray-600"
          >
            <option value="">Todos los comedores</option>
            {comedorOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        )}

        {readonly && (
          onNuevoCierre ? (
            <Button
              size="sm"
              onClick={onNuevoCierre}
              className="ml-auto gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-wide transition hover:scale-105"
            >
              <Plus className="h-4 w-4" />
              Nuevo Cierre
            </Button>
          ) : (
            <Button
              asChild
              size="sm"
              className="ml-auto gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-wide transition hover:scale-105"
            >
              <Link href="/nuevo-cierre" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Cierre
              </Link>
            </Button>
          )
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : displayedCierres.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
          <SlidersHorizontal className="h-8 w-8 opacity-40" />
          <p className="text-sm">
            {cierres.length === 0
              ? "No hay cierres registrados"
              : "Ningún cierre coincide con los filtros"}
          </p>
          {cierres.length > 0 && (
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
          <div className="px-6 py-2 border-b bg-gray-50/60">
            <p className="text-xs text-gray-400">
              {displayedCierres.length} resultado
              {displayedCierres.length !== 1 ? "s" : ""}
              {hasActiveFilters && (
                <button
                  onClick={onClearFilters}
                  className="ml-2 text-primary hover:underline underline-offset-2"
                >
                  Limpiar filtros
                </button>
              )}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100/80 text-left text-xs uppercase text-gray-500 tracking-wider">
                  <th className="px-4 py-3 w-8" />
                  {sortableTh("Fecha", "fechaOperacion")}
                  {sortableTh("Comedor", "comedor")}
                  {sortableTh("Creado por", "creadoPor")}
                  {sortableTh("Punto de Venta", "puntoDeVenta")}
                  {sortableTh("Platos", "totalPlatosVendidos", "text-center")}
                  {sortableTh("Monto Total", "montoTotal", "text-right")}
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3">Comentarios</th>
                  {!readonly && <th className="px-4 py-3 w-12" />}
                </tr>
              </thead>
              <tbody>
                {displayedCierres.map((cierre) => {
                  const isExpanded = expandedRows.has(cierre.id);
                  const isAnulado = cierre.anulacionId !== null;
                  const movimientos: MovimientoResponse[] =
                    cierre.movimientos ?? [];
                  const activeMovimientos = movimientos.filter(
                    (m) => m.anulacionId === null,
                  );
                  const anuladosMovimientos = movimientos.filter(
                    (m) => m.anulacionId !== null,
                  );

                  return (
                    <Fragment key={cierre.id}>
                      <tr
                        className={cn(
                          "border-b transition-colors",
                          isAnulado
                            ? "bg-red-50/30 text-gray-400"
                            : "hover:bg-gray-50/80",
                        )}
                      >
                        <td
                          className="px-4 py-4 cursor-pointer text-gray-400 hover:text-gray-600"
                          onClick={() => toggleRow(cierre.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </td>
                        <td
                          className="px-4 py-4 font-medium cursor-pointer whitespace-nowrap"
                          onClick={() => toggleRow(cierre.id)}
                        >
                          {cierre.fechaOperacion}
                        </td>
                        <td
                          className="px-4 py-4 cursor-pointer"
                          onClick={() => toggleRow(cierre.id)}
                        >
                          {cierre.comedor.nombre}
                        </td>
                        <td
                          className="px-4 py-4 cursor-pointer"
                          onClick={() => toggleRow(cierre.id)}
                        >
                          {cierre.creadoPor.nombre}
                        </td>
                        <td
                          className="px-4 py-4 cursor-pointer"
                          onClick={() => toggleRow(cierre.id)}
                        >
                          {cierre.puntoDeVenta.nombre}
                        </td>
                        <td
                          className="px-4 py-4 text-center cursor-pointer"
                          onClick={() => toggleRow(cierre.id)}
                        >
                          {cierre.totalPlatosVendidos}
                        </td>
                        <td
                          className="px-4 py-4 text-right font-mono cursor-pointer"
                          onClick={() => toggleRow(cierre.id)}
                        >
                          {formatCurrency(cierre.montoTotal)}
                        </td>
                        <td
                          className="px-4 py-4 text-center cursor-pointer"
                          onClick={() => toggleRow(cierre.id)}
                        >
                          {isAnulado ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600">
                              <Ban className="h-3 w-3" />
                              Anulado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                              Activo
                            </span>
                          )}
                        </td>
                        <td
                          className="px-4 py-4 text-gray-500 cursor-pointer max-w-[160px] truncate"
                          onClick={() => toggleRow(cierre.id)}
                        >
                          {cierre.comentarios || (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>

                        {!readonly && (
                          <td className="px-4 py-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild disabled={isAnulado}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 data-[state=open]:bg-gray-100 disabled:opacity-30"
                                  aria-label="Acciones"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-44 rounded-xl shadow-lg border-gray-100"
                              >
                                <DropdownMenuItem
                                  onClick={() => onEditar?.(cierre.id)}
                                  className="gap-2.5 cursor-pointer rounded-lg text-gray-700 focus:text-gray-900"
                                >
                                  <Pencil className="h-4 w-4 text-gray-400" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-1" />
                                <DropdownMenuItem
                                  onClick={() => onAnular?.(cierre)}
                                  className="gap-2.5 cursor-pointer rounded-lg text-red-600 focus:text-red-700 focus:bg-red-50"
                                >
                                  <Ban className="h-4 w-4" />
                                  Anular
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        )}
                      </tr>

                      {isExpanded && (
                        <tr
                          key={`${cierre.id}-movimientos`}
                          className="bg-gray-50/60"
                        >
                          <td colSpan={colSpanTotal} className="px-8 py-4">
                            {movimientos.length === 0 ? (
                              <p className="text-gray-400 text-sm italic">
                                Sin movimientos registrados
                              </p>
                            ) : (
                              <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="bg-gray-100 text-left text-xs uppercase text-gray-500 tracking-wider">
                                      <th className="px-4 py-2.5">Fecha y Hora</th>
                                      <th className="px-4 py-2.5">Medio de Pago</th>
                                      <th className="px-4 py-2.5 text-right">Monto</th>
                                      <th className="px-4 py-2.5 text-center">Estado</th>
                                      <th className="px-4 py-2.5">Comentarios</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {activeMovimientos.map((mov) => (
                                      <MovimientoRow key={mov.id} mov={mov} />
                                    ))}
                                    {anuladosMovimientos.length > 0 && (
                                      <AnuladosMovimientosGroup
                                        movimientos={anuladosMovimientos}
                                      />
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

function MovimientoRow({ mov }: { mov: MovimientoResponse }) {
  const isAnulado = !!mov.anulacionId;
  return (
    <tr
      className={cn(
        "transition-colors",
        isAnulado ? "opacity-40" : "hover:bg-white",
      )}
    >
      <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{mov.fechaHora}</td>
      <td className="px-4 py-2.5 font-medium">{mov.medioPago}</td>
      <td className="px-4 py-2.5 text-right font-mono">{formatCurrency(mov.monto)}</td>
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

function AnuladosMovimientosGroup({
  movimientos,
}: {
  movimientos: MovimientoResponse[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr className="bg-gray-50/80">
        <td colSpan={5} className="px-4 py-2">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {open ? "Ocultar" : "Mostrar"} anulados ({movimientos.length})
          </button>
        </td>
      </tr>
      {open && movimientos.map((mov) => <MovimientoRow key={mov.id} mov={mov} />)}
    </>
  );
}

export function CierresStats({
  cierres,
  filteredCierres,
}: {
  cierres: DetailedCierreCajaResponse[];
  filteredCierres: DetailedCierreCajaResponse[];
}) {
  const totalActivos = cierres.filter((c) => c.anulacionId === null).length;
  const totalAnulados = cierres.filter((c) => c.anulacionId !== null).length;
  const montoTotal = cierres
    .filter((c) => c.anulacionId === null)
    .reduce((s, c) => s + c.montoTotal, 0);
  const montoFiltrado = filteredCierres
    .filter((c) => c.anulacionId === null)
    .reduce((s, c) => s + c.montoTotal, 0);
  const isFiltered = filteredCierres.length !== cierres.length;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
      <StatCard label="Total cierres" value={cierres.length} />
      <StatCard label="Activos" value={totalActivos} accent="emerald" />
      <StatCard label="Anulados" value={totalAnulados} accent="red" />
      <StatCard label="Monto total" value={formatCurrency(montoTotal)} />
      <StatCard
        label={isFiltered ? "Monto filtrado" : "Monto activo"}
        value={formatCurrency(montoFiltrado)}
        accent={isFiltered ? "blue" : undefined}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "emerald" | "red" | "blue";
}) {
  return (
    <div className="rounded-xl border-0 bg-white shadow-sm px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-2xl font-bold tabular-nums",
          accent === "emerald" && "text-emerald-600",
          accent === "red" && "text-red-500",
          accent === "blue" && "text-blue-600",
          !accent && "text-gray-800",
        )}
      >
        {value}
      </p>
    </div>
  );
}
