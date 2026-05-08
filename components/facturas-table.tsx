
"use client";

import { Fragment, useMemo, useState } from "react";
import {
  ChevronDown, ChevronUp, ChevronsUpDown,
  MoreHorizontal, Ban, Pencil, Search, X,
  SlidersHorizontal, Plus, Send, CircleDollarSign,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FacturaPuntoDeVentaMonto } from "@/models/dto/compra/FacturaPuntoDeVentaMonto";
import { FacturaProveedorResponse } from "@/models/dto/compra/FacturaProveedorResponse";
import { ProveedorResponse } from "@/models/dto/proveedor/ProveedorResponse";
import { EstadoFactura } from "@/models/enums/EstadoFactura";

export type FacturaSortKey = "fechaCarga" | "monto" | "proveedor" | "creadoPor" | "estado";
export type FacturaSortDir = "asc" | "desc";
export type FacturaStatusFilter = "all" | EstadoFactura;

const statusLabel: Record<FacturaStatusFilter, string> = {
  all: "Todos",
  PENDIENTE: "Pendiente",
  EMITIDA: "Emitida",
  PAGADA: "Pagada",
  ANULADA: "Anulada",
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(amount);

const getFacturaFechaCarga = (factura: FacturaProveedorResponse) =>
  factura.creadoEn ? factura.creadoEn.slice(0, 10) : "";

function estadoBadge(estado: EstadoFactura) {
  const base = "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold";
  switch (estado) {
    case "PENDIENTE": return <span className={cn(base, "bg-amber-100 text-amber-700")}>Pendiente</span>;
    case "EMITIDA":   return <span className={cn(base, "bg-blue-100 text-blue-700")}>Emitida</span>;
    case "PAGADA":    return <span className={cn(base, "bg-emerald-100 text-emerald-700")}>Pagada</span>;
    case "ANULADA":   return <span className={cn(base, "bg-red-100 text-red-600")}><Ban className="h-3 w-3" />Anulada</span>;
  }
}

export interface FacturasTableProps {
  facturas: FacturaProveedorResponse[];
  proveedores: ProveedorResponse[];
  loading: boolean;
  readonly?: boolean;
  displayedFacturas?: FacturaProveedorResponse[];
  comedorNameById?: Record<number, string>;
  puntoDeVentaNameById?: Record<number, string>;
  dateDesde: string;
  dateHasta: string;
  comedorIdFilter: number | null;
  search?: string;
  onSearchChange?: (value: string) => void;
  statusFilter?: FacturaStatusFilter;
  onStatusFilterChange?: (value: FacturaStatusFilter) => void;
  sortKey?: FacturaSortKey;
  sortDir?: FacturaSortDir;
  onSort?: (key: FacturaSortKey) => void;
  onNuevaFactura?: () => void;
  onEmitir?: (factura: FacturaProveedorResponse) => void;
  onPagar?: (factura: FacturaProveedorResponse) => void;
  onEditar?: (factura: FacturaProveedorResponse) => void;
  onAnular?: (factura: FacturaProveedorResponse) => void;
  showCreadoPor?: boolean;
  extraActiveFilters?: boolean;
  onClearFilters: () => void;
}

function SortIcon({ col, sortKey, sortDir }: { col: FacturaSortKey; sortKey: FacturaSortKey; sortDir: FacturaSortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="ml-1 inline h-3 w-3 opacity-30" />;
  return sortDir === "asc"
    ? <ChevronUp className="ml-1 inline h-3 w-3 text-primary" />
    : <ChevronDown className="ml-1 inline h-3 w-3 text-primary" />;
}

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</span>
      <span className="text-sm text-gray-700">
        {value && value.trim() !== "" ? value : "—"}
      </span>
    </div>
  );
}

function getPuntoDeVentaLabel(
  puntoDeVentaId: string,
  puntoDeVentaNameById?: Record<number, string>,
) {
  return puntoDeVentaNameById?.[Number(puntoDeVentaId)] ?? `Punto ${puntoDeVentaId}`;
}

function FacturaDetail({
  factura,
  puntoDeVentaNameById,
  showCreadoPor = false,
}: {
  factura: FacturaProveedorResponse;
  puntoDeVentaNameById?: Record<number, string>;
  showCreadoPor?: boolean;
}) {
  const distribucion = [...(factura.puntoDeVentaComedor ?? [])].sort(
    (left, right) => left.puntoDeVentaId - right.puntoDeVentaId,
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DetailField
          label="Punto de venta proveedor"
          value={
            factura.puntoDeVentaProveedor !== null
              ? String(factura.puntoDeVentaProveedor)
              : null
          }
        />
        <DetailField label="Número operación" value={factura.numeroOperacion} />
        <DetailField label="Medio de pago" value={factura.medioPago} />
        {showCreadoPor && (
          <DetailField label="Creado por" value={factura.creadoPorNombre} />
        )}
      </div>

      <div className="space-y-2">
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Distribución comedor
          </span>
        </div>
        {distribucion.length === 0 ? (
          <p className="text-sm text-gray-500">Sin puntos de venta asociados.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {distribucion.map((item: FacturaPuntoDeVentaMonto) => (
              <div
                key={item.puntoDeVentaId}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
              >
                <span className="text-sm text-gray-700">
                  {getPuntoDeVentaLabel(String(item.puntoDeVentaId), puntoDeVentaNameById)}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(item.monto)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function FacturasTable({
  facturas, proveedores, loading, readonly = false,
  displayedFacturas,
  comedorNameById,
  puntoDeVentaNameById,
  dateDesde, dateHasta, comedorIdFilter,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortKey,
  sortDir,
  onSort,
  onNuevaFactura, onEmitir, onPagar, onEditar, onAnular, onClearFilters,
  showCreadoPor = false,
  extraActiveFilters = false,
}: FacturasTableProps) {
  const [localSearch, setLocalSearch] = useState("");
  const [localStatusFilter, setLocalStatusFilter] = useState<FacturaStatusFilter>("all");
  const [localSortKey, setLocalSortKey] = useState<FacturaSortKey>("fechaCarga");
  const [localSortDir, setLocalSortDir] = useState<FacturaSortDir>("desc");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const activeSearch = search ?? localSearch;
  const activeStatusFilter = statusFilter ?? localStatusFilter;
  const activeSortKey = sortKey ?? localSortKey;
  const activeSortDir = sortDir ?? localSortDir;
  const setSearchValue = onSearchChange ?? setLocalSearch;
  const setStatusFilterValue = onStatusFilterChange ?? setLocalStatusFilter;

  const proveedorMap = useMemo(() =>
    Object.fromEntries(proveedores.map((p) => [p.id, p.nombre])),
    [proveedores]
  );

  const displayed = useMemo(() => {
    if (displayedFacturas) return displayedFacturas;

    let list = [...facturas];
    if (dateDesde) list = list.filter((f) => getFacturaFechaCarga(f) >= dateDesde);
    if (dateHasta) list = list.filter((f) => getFacturaFechaCarga(f) <= dateHasta);
    if (comedorIdFilter !== null) list = list.filter((f) => f.comedorId === comedorIdFilter);
    if (activeStatusFilter !== "all") list = list.filter((f) => f.estado === activeStatusFilter);
    if (activeSearch.trim()) {
      const q = activeSearch.trim().toLowerCase();
      list = list.filter((f) =>
        f.numero.toLowerCase().includes(q) ||
        (proveedorMap[f.proveedorId] ?? "").toLowerCase().includes(q) ||
        (f.creadoPorNombre ?? "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      if (activeSortKey === "fechaCarga") { av = getFacturaFechaCarga(a); bv = getFacturaFechaCarga(b); }
      if (activeSortKey === "monto") { av = a.monto; bv = b.monto; }
      if (activeSortKey === "proveedor") { av = proveedorMap[a.proveedorId] ?? ""; bv = proveedorMap[b.proveedorId] ?? ""; }
      if (activeSortKey === "creadoPor") { av = a.creadoPorNombre ?? ""; bv = b.creadoPorNombre ?? ""; }
      if (activeSortKey === "estado") { av = a.estado; bv = b.estado; }
      if (av < bv) return activeSortDir === "asc" ? -1 : 1;
      if (av > bv) return activeSortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [
    activeSearch,
    activeSortDir,
    activeSortKey,
    activeStatusFilter,
    comedorIdFilter,
    dateDesde,
    dateHasta,
    displayedFacturas,
    facturas,
    proveedorMap,
  ]);

  const hasActiveFilters = Boolean(
    activeSearch ||
    activeStatusFilter !== "all" ||
    dateDesde ||
    dateHasta ||
    comedorIdFilter !== null ||
    extraActiveFilters,
  );

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSort = (key: FacturaSortKey) => {
    if (onSort) {
      onSort(key);
      return;
    }
    if (key === activeSortKey) setLocalSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setLocalSortKey(key); setLocalSortDir("asc"); }
  };

  const sortableTh = (label: string, key: FacturaSortKey, className?: string) => (
    <th className={cn("px-3 py-3 cursor-pointer select-none leading-tight hover:text-gray-700 transition-colors", className)}
      onClick={() => handleSort(key)}>
      {label}<SortIcon col={key} sortKey={activeSortKey} sortDir={activeSortDir} />
    </th>
  );

  const statuses: FacturaStatusFilter[] = ["all", "PENDIENTE", "EMITIDA", "PAGADA", "ANULADA"];

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 px-6 py-4 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <Input value={activeSearch} onChange={(e) => setSearchValue(e.target.value)}
            placeholder={showCreadoPor ? "Buscar número, proveedor o creado por..." : "Buscar número o proveedor..."}
            className="pl-8 h-8 w-52 text-sm bg-gray-50 border-gray-200" />
          {activeSearch && (
            <button onClick={() => setSearchValue("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
          {statuses.map((s) => (
            <button key={s} onClick={() => setStatusFilterValue(s)}
              className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                activeStatusFilter === s ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
              )}>
              {statusLabel[s]}
            </button>
          ))}
        </div>

        {onNuevaFactura && (
          <Button onClick={onNuevaFactura} size="sm"
            className="ml-auto gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-wide transition hover:scale-105">
            <Plus className="h-4 w-4" />
            Nueva Factura
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
          <SlidersHorizontal className="h-8 w-8 opacity-40" />
          <p className="text-sm">
            {facturas.length === 0 ? "No hay facturas registradas" : "Ninguna factura coincide con los filtros"}
          </p>
          {facturas.length > 0 && (
            <button onClick={onClearFilters} className="text-xs text-primary underline-offset-2 hover:underline">
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="px-6 py-2 border-b bg-gray-50/60">
            <p className="text-xs text-gray-400">
              {displayed.length} resultado{displayed.length !== 1 ? "s" : ""}
              {hasActiveFilters && (
                <button onClick={onClearFilters} className="ml-2 text-primary hover:underline underline-offset-2">
                  Limpiar filtros
                </button>
              )}
            </p>
          </div>
          <div className="overflow-x-hidden">
            <table className="w-full table-fixed border-collapse text-[12px] xl:text-[13px]">
              <thead>
                <tr className="bg-gray-100/80 text-left text-[11px] uppercase text-gray-500 tracking-wide xl:text-xs">
                  <th className="px-3 py-3 w-8" />
                  {sortableTh("Fecha", "fechaCarga", "w-[7%] whitespace-nowrap")}
                  <th className="px-3 py-3 w-[8%] whitespace-nowrap">Número</th>
                  {sortableTh("Proveedor", "proveedor", "w-[17%]")}
                  {showCreadoPor && sortableTh("Creado por", "creadoPor", "w-[10%]")}
                  <th className="px-3 py-3 w-[8%]">Comedor</th>
                  {sortableTh("Monto", "monto", "w-[10%] text-right whitespace-nowrap")}
                  {sortableTh("Estado", "estado", "w-[8%] text-center")}
                  <th className="px-3 py-3 w-[9%] leading-tight">Fecha factura</th>
                  <th className="px-3 py-3 w-[8%] leading-tight">Fecha emisión</th>
                  <th className="px-3 py-3 w-[8%] leading-tight">Fecha pago</th>
                  {!readonly && <th className="px-3 py-3 w-10" />}
                </tr>
              </thead>
              <tbody>
                {displayed.map((factura) => {
                  const isExpanded = expandedRows.has(factura.id);
                  const isAnulada = factura.estado === "ANULADA";
                  const isPagada = factura.estado === "PAGADA";
                  const hasActions = !readonly && !isAnulada && !isPagada;
                  const detailColSpan = (readonly ? 10 : 11) + (showCreadoPor ? 1 : 0);

                  return (
                    <Fragment key={factura.id}>
                      <tr
                        className={cn(
                          "border-b transition-colors",
                          isAnulada ? "bg-red-50/30 text-gray-400" : "hover:bg-gray-50/80",
                        )}
                      >
                        <td
                          className="px-3 py-4 cursor-pointer text-gray-400 hover:text-gray-600 align-top"
                          onClick={() => toggleRow(factura.id)}
                        >
                          {isExpanded
                            ? <ChevronUp className="h-4 w-4" />
                            : <ChevronDown className="h-4 w-4" />}
                        </td>
                        <td
                          className="px-3 py-4 cursor-pointer font-medium whitespace-nowrap align-top"
                          onClick={() => toggleRow(factura.id)}
                        >
                          {getFacturaFechaCarga(factura)}
                        </td>
                        <td
                          className="px-3 py-4 cursor-pointer font-mono text-xs whitespace-nowrap align-top"
                          onClick={() => toggleRow(factura.id)}
                        >
                          {factura.numero}
                        </td>
                        <td className="px-3 py-4 cursor-pointer break-words align-top" onClick={() => toggleRow(factura.id)}>
                          {proveedorMap[factura.proveedorId] ?? factura.proveedorId}
                        </td>
                        {showCreadoPor && (
                          <td className="px-3 py-4 cursor-pointer break-words align-top" onClick={() => toggleRow(factura.id)}>
                            {factura.creadoPorNombre ?? <span className="text-gray-300">—</span>}
                          </td>
                        )}
                        <td className="px-3 py-4 cursor-pointer align-top" onClick={() => toggleRow(factura.id)}>
                          {comedorNameById?.[factura.comedorId] ?? factura.comedorId}
                        </td>
                        <td
                          className="px-3 py-4 cursor-pointer text-right font-mono whitespace-nowrap align-top"
                          onClick={() => toggleRow(factura.id)}
                        >
                          {formatCurrency(factura.monto)}
                        </td>
                        <td className="px-3 py-4 cursor-pointer text-center align-top" onClick={() => toggleRow(factura.id)}>
                          {estadoBadge(factura.estado)}
                        </td>
                        <td
                          className="px-3 py-4 cursor-pointer text-gray-500 whitespace-nowrap align-top"
                          onClick={() => toggleRow(factura.id)}
                        >
                          {factura.fechaFactura ?? <span className="text-gray-300">—</span>}
                        </td>
                        <td
                          className="px-3 py-4 cursor-pointer text-gray-500 whitespace-nowrap align-top"
                          onClick={() => toggleRow(factura.id)}
                        >
                          {factura.fechaEmision ?? <span className="text-gray-300">—</span>}
                        </td>
                        <td
                          className="px-3 py-4 cursor-pointer text-gray-500 whitespace-nowrap align-top"
                          onClick={() => toggleRow(factura.id)}
                        >
                          {factura.fechaPago ?? <span className="text-gray-300">—</span>}
                        </td>
                        {!readonly && (
                          <td className="px-3 py-4 align-top">
                            {hasActions ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon"
                                    className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                                    aria-label="Acciones">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-lg border-gray-100">
                                  {factura.estado === "PENDIENTE" && (
                                    <DropdownMenuItem onClick={() => onEmitir?.(factura)}
                                      className="gap-2.5 cursor-pointer rounded-lg text-blue-600 focus:text-blue-700 focus:bg-blue-50">
                                      <Send className="h-4 w-4" />Emitir
                                    </DropdownMenuItem>
                                  )}
                                  {factura.estado === "EMITIDA" && (
                                    <DropdownMenuItem onClick={() => onPagar?.(factura)}
                                      className="gap-2.5 cursor-pointer rounded-lg text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50">
                                      <CircleDollarSign className="h-4 w-4" />Pagar
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => onEditar?.(factura)}
                                    className="gap-2.5 cursor-pointer rounded-lg text-gray-700 focus:text-gray-900">
                                    <Pencil className="h-4 w-4 text-gray-400" />Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="my-1" />
                                  <DropdownMenuItem onClick={() => onAnular?.(factura)}
                                    className="gap-2.5 cursor-pointer rounded-lg text-red-600 focus:text-red-700 focus:bg-red-50">
                                    <Ban className="h-4 w-4" />Anular
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : null}
                          </td>
                        )}
                      </tr>
                      {isExpanded && (
                        <tr className="bg-gray-50/60">
                          <td colSpan={detailColSpan} className="px-8 py-5">
                            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                              <FacturaDetail
                                factura={factura}
                                puntoDeVentaNameById={puntoDeVentaNameById}
                                showCreadoPor={showCreadoPor}
                              />
                            </div>
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
