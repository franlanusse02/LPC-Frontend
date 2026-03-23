
"use client";

import { useMemo, useState } from "react";
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
import { FacturaProveedorResponse } from "@/models/dto/compra/FacturaProveedorResponse";
import { ProveedorResponse } from "@/models/dto/proveedor/ProveedorResponse";
import { EstadoFactura } from "@/models/enums/EstadoFactura";

type SortKey = "fechaFactura" | "monto" | "proveedor" | "estado";
type SortDir = "asc" | "desc";
type StatusFilter = "all" | EstadoFactura;

const statusLabel: Record<StatusFilter, string> = {
  all: "Todos",
  PENDIENTE: "Pendiente",
  EMITIDA: "Emitida",
  PAGADA: "Pagada",
  ANULADA: "Anulada",
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(amount);

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
  dateDesde: string;
  dateHasta: string;
  comedorIdFilter: number | null;
  onNuevaFactura?: () => void;
  onEmitir?: (factura: FacturaProveedorResponse) => void;
  onPagar?: (factura: FacturaProveedorResponse) => void;
  onEditar?: (factura: FacturaProveedorResponse) => void;
  onAnular?: (factura: FacturaProveedorResponse) => void;
  onClearFilters: () => void;
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="ml-1 inline h-3 w-3 opacity-30" />;
  return sortDir === "asc"
    ? <ChevronUp className="ml-1 inline h-3 w-3 text-primary" />
    : <ChevronDown className="ml-1 inline h-3 w-3 text-primary" />;
}

export function FacturasTable({
  facturas, proveedores, loading, readonly = false,
  dateDesde, dateHasta, comedorIdFilter,
  onNuevaFactura, onEmitir, onPagar, onEditar, onAnular, onClearFilters,
}: FacturasTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("fechaFactura");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const proveedorMap = useMemo(() =>
    Object.fromEntries(proveedores.map((p) => [p.id, p.nombre])),
    [proveedores]
  );

  const displayed = useMemo(() => {
    let list = [...facturas];
    if (dateDesde) list = list.filter((f) => f.fechaFactura >= dateDesde);
    if (dateHasta) list = list.filter((f) => f.fechaFactura <= dateHasta);
    if (comedorIdFilter !== null) list = list.filter((f) => f.comedorId === comedorIdFilter);
    if (statusFilter !== "all") list = list.filter((f) => f.estado === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((f) =>
        f.numero.toLowerCase().includes(q) ||
        (proveedorMap[f.proveedorId] ?? "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      if (sortKey === "fechaFactura") { av = a.fechaFactura; bv = b.fechaFactura; }
      if (sortKey === "monto") { av = a.monto; bv = b.monto; }
      if (sortKey === "proveedor") { av = proveedorMap[a.proveedorId] ?? ""; bv = proveedorMap[b.proveedorId] ?? ""; }
      if (sortKey === "estado") { av = a.estado; bv = b.estado; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [facturas, dateDesde, dateHasta, comedorIdFilter, statusFilter, search, sortKey, sortDir, proveedorMap]);

  const hasActiveFilters = search || statusFilter !== "all" || dateDesde || dateHasta || comedorIdFilter;

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const sortableTh = (label: string, key: SortKey, className?: string) => (
    <th className={cn("px-4 py-3 cursor-pointer select-none whitespace-nowrap hover:text-gray-700 transition-colors", className)}
      onClick={() => handleSort(key)}>
      {label}<SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
    </th>
  );

  const statuses: StatusFilter[] = ["all", "PENDIENTE", "EMITIDA", "PAGADA", "ANULADA"];

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 px-6 py-4 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar número o proveedor..."
            className="pl-8 h-8 w-52 text-sm bg-gray-50 border-gray-200" />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
          {statuses.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                statusFilter === s ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
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
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100/80 text-left text-xs uppercase text-gray-500 tracking-wider">
                  {sortableTh("Fecha", "fechaFactura")}
                  <th className="px-4 py-3">Número</th>
                  {sortableTh("Proveedor", "proveedor")}
                  <th className="px-4 py-3">Comedor</th>
                  {sortableTh("Monto", "monto", "text-right")}
                  {sortableTh("Estado", "estado", "text-center")}
                  <th className="px-4 py-3 whitespace-nowrap">Fecha Pago</th>
                  {!readonly && <th className="px-4 py-3 w-12" />}
                </tr>
              </thead>
              <tbody>
                {displayed.map((factura) => {
                  const isAnulada = factura.estado === "ANULADA";
                  const isPagada = factura.estado === "PAGADA";
                  const hasActions = !readonly && !isAnulada && !isPagada;

                  return (
                    <tr key={factura.id}
                      className={cn("border-b transition-colors",
                        isAnulada ? "bg-red-50/30 text-gray-400" : "hover:bg-gray-50/80"
                      )}>
                      <td className="px-4 py-4 font-medium whitespace-nowrap">{factura.fechaFactura}</td>
                      <td className="px-4 py-4 font-mono text-xs">{factura.numero}</td>
                      <td className="px-4 py-4">{proveedorMap[factura.proveedorId] ?? factura.proveedorId}</td>
                      <td className="px-4 py-4">{factura.comedorId}</td>
                      <td className="px-4 py-4 text-right font-mono">{formatCurrency(factura.monto)}</td>
                      <td className="px-4 py-4 text-center">{estadoBadge(factura.estado)}</td>
                      <td className="px-4 py-4 text-gray-500 whitespace-nowrap">
                        {factura.fechaPago ?? <span className="text-gray-300">—</span>}
                      </td>
                      {!readonly && (
                        <td className="px-4 py-4">
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
