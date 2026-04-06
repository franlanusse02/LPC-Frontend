"use client";

import { Fragment, useMemo, useState } from "react";
import {
  ChevronDown, ChevronUp, ChevronsUpDown,
  MoreHorizontal, Ban, Pencil, Search, X,
  SlidersHorizontal, Paperclip, CircleCheckBig, Send, CircleDollarSign, Trash2,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { EventoResponse } from "@/models/dto/evento/EventoResponse";
import { EstadoEvento, EstadoEventoLabel } from "@/models/enums/EstadoEvento";
import { Plus } from "lucide-react";

export type EventoSortKey = "fechaEvento" | "comedor" | "montoTotal" | "estado";
export type EventoSortDir = "asc" | "desc";
export type EventoStatusFilter = "all" | EstadoEvento;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(amount);

function estadoBadge(estado: EstadoEvento) {
  const base = "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold";
  switch (estado) {
    case "SOLICITADO":     return <span className={cn(base, "bg-sky-100 text-sky-700")}>Solicitado</span>;
    case "REALIZADO":      return <span className={cn(base, "bg-emerald-100 text-emerald-700")}>Realizado</span>;
    case "FACTURA_EMITIDA":return <span className={cn(base, "bg-violet-100 text-violet-700")}>Factura emitida</span>;
    case "COBRADO":        return <span className={cn(base, "bg-gray-100 text-gray-700")}>Cobrado</span>;
    case "ANULADO":        return <span className={cn(base, "bg-red-100 text-red-600")}><Ban className="h-3 w-3" />Anulado</span>;
  }
}

const STATUS_FILTERS: EventoStatusFilter[] = ["all", "SOLICITADO", "REALIZADO", "FACTURA_EMITIDA", "COBRADO", "ANULADO"];

const statusFilterLabel: Record<EventoStatusFilter, string> = {
  all: "Todos",
  SOLICITADO: "Solicitados",
  REALIZADO: "Realizados",
  FACTURA_EMITIDA: "Factura emitida",
  COBRADO: "Cobrados",
  ANULADO: "Anulados",
};

export interface EventosTableProps {
  eventos: EventoResponse[];
  displayedEventos: EventoResponse[];
  comedorNameById: Record<number, string>;
  loading: boolean;
  readonly?: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: EventoStatusFilter;
  onStatusFilterChange: (v: EventoStatusFilter) => void;
  sortKey: EventoSortKey;
  sortDir: EventoSortDir;
  onSort: (key: EventoSortKey) => void;
  onEditar?: (evento: EventoResponse) => void;
  onRealizar?: (evento: EventoResponse) => void;
  onEmitir?: (evento: EventoResponse) => void;
  onPagar?: (evento: EventoResponse) => void;
  onEliminarPdf?: (evento: EventoResponse) => void;
  onAnular?: (evento: EventoResponse) => void;
  onNuevoEvento?: () => void;
  onClearFilters: () => void;
}

const EVENTOS_PDF_BASE_URL = process.env.NEXT_PUBLIC_EVENTOS_PDF_BASE_URL?.replace(/\/$/, "");

function getEventoPdfHref(evento: EventoResponse) {
  if (!evento.facturaPdfObjectKey) return null;
  if (/^https?:\/\//i.test(evento.facturaPdfObjectKey)) {
    return evento.facturaPdfObjectKey;
  }
  if (EVENTOS_PDF_BASE_URL) {
    return `${EVENTOS_PDF_BASE_URL}/${evento.facturaPdfObjectKey.replace(/^\/+/, "")}`;
  }
  return null;
}

function SortIcon({ col, sortKey, sortDir }: { col: EventoSortKey; sortKey: EventoSortKey; sortDir: EventoSortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="ml-1 inline h-3 w-3 opacity-30" />;
  return sortDir === "asc"
    ? <ChevronUp className="ml-1 inline h-3 w-3 text-primary" />
    : <ChevronDown className="ml-1 inline h-3 w-3 text-primary" />;
}

function DetailField({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</span>
      <span className="text-sm text-gray-700">{value}</span>
    </div>
  );
}

function EventoDetail({ evento, comedorName }: { evento: EventoResponse; comedorName: string }) {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
      <DetailField label="Comedor" value={comedorName} />
      <DetailField label="Tipo de evento" value={evento.tipoEventoNombre} />
      <DetailField label="Solicitante" value={evento.solicitante} />
      <DetailField label="Cantidad personas" value={evento.cantidadPersonas} />
      <DetailField label="Precio unitario" value={evento.precioUnitario !== null ? formatCurrency(evento.precioUnitario) : null} />
      <DetailField label="Monto total" value={evento.montoTotal !== null ? formatCurrency(evento.montoTotal) : null} />
      <DetailField label="Centro de costo" value={evento.centroCosto} />
      <DetailField label="Edificio" value={evento.edificioNombre} />
      <DetailField label="Sala" value={evento.salaNombre} />
      <DetailField label="Funcionario" value={evento.funcionario} />
      <DetailField label="Oficina" value={evento.oficina} />
      <DetailField label="Responsable" value={evento.responsable} />
      <DetailField label="Empresa" value={evento.empresa} />
      <DetailField label="Dest. facturación" value={evento.destinatarioFactura} />
      <DetailField label="Área" value={evento.area} />
      <DetailField label="Email solicitante" value={evento.emailSolicitante} />
      <DetailField label="Lugar" value={evento.lugar} />
      <DetailField label="Medio de pago" value={evento.medioPago} />
      <DetailField label="Nro. operación" value={evento.numeroOperacion} />
      <DetailField label="Nro. orden / pedido" value={evento.numeroOrden} />
      <DetailField label="Concepto" value={evento.concepto} />
      <DetailField label="Tipo comprobante" value={evento.tipoComprobante} />
      <DetailField label="Nro. comprobante" value={evento.numeroComprobante} />
      {evento.facturaPdfNombreArchivo && (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Factura PDF</span>
          {getEventoPdfHref(evento) ? (
            <a
              href={getEventoPdfHref(evento) ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline underline-offset-2"
            >
              <Paperclip className="h-3.5 w-3.5" />
              {evento.facturaPdfNombreArchivo}
            </a>
          ) : (
            <span className="inline-flex items-center gap-1 text-sm text-gray-700">
              <Paperclip className="h-3.5 w-3.5" />
              {evento.facturaPdfNombreArchivo}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function EventosTable({
  eventos,
  displayedEventos,
  comedorNameById,
  loading,
  readonly = false,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortKey,
  sortDir,
  onSort,
  onEditar,
  onRealizar,
  onEmitir,
  onPagar,
  onEliminarPdf,
  onAnular,
  onNuevoEvento,
  onClearFilters,
}: EventosTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const hasActiveFilters = search || statusFilter !== "all";

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const sortableTh = (label: string, key: EventoSortKey, className?: string) => (
    <th
      className={cn("px-4 py-3 cursor-pointer select-none whitespace-nowrap hover:text-gray-700 transition-colors", className)}
      onClick={() => onSort(key)}
    >
      {label}
      <SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
    </th>
  );

  return (
    <>
      {/* Toolbar */}
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
            <button onClick={() => onSearchChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => onStatusFilterChange(s)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                statusFilter === s ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700",
              )}
            >
              {statusFilterLabel[s]}
            </button>
          ))}
        </div>

        {readonly && onNuevoEvento && (
          <Button
            size="sm"
            onClick={onNuevoEvento}
            className="ml-auto gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-wide transition hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            Nuevo Evento
          </Button>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : displayedEventos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
          <SlidersHorizontal className="h-8 w-8 opacity-40" />
          <p className="text-sm">
            {eventos.length === 0 ? "No hay eventos registrados" : "Ningún evento coincide con los filtros"}
          </p>
          {eventos.length > 0 && (
            <button onClick={onClearFilters} className="text-xs text-primary underline-offset-2 hover:underline">
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="px-6 py-2 border-b bg-gray-50/60">
            <p className="text-xs text-gray-400">
              {displayedEventos.length} resultado{displayedEventos.length !== 1 ? "s" : ""}
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
                  <th className="px-4 py-3 w-8" />
                  {sortableTh("Fecha", "fechaEvento")}
                  {sortableTh("Comedor", "comedor")}
                  <th className="px-4 py-3 whitespace-nowrap">Tipo de evento</th>
                  <th className="px-4 py-3 whitespace-nowrap">Solicitante</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">Personas</th>
                  {sortableTh("Monto", "montoTotal", "text-right")}
                  {sortableTh("Estado", "estado", "text-center")}
                  <th className="px-4 py-3 text-center w-10">PDF</th>
                  {!readonly && <th className="px-4 py-3 w-12" />}
                </tr>
              </thead>
              <tbody>
                {displayedEventos.map((evento) => {
                  const isExpanded = expandedRows.has(evento.id);
                  const isAnulado = evento.estado === "ANULADO";
                  const comedorName = comedorNameById[evento.comedorId] ?? String(evento.comedorId);
                  const pdfHref = getEventoPdfHref(evento);
                  const hasPdf = !!evento.facturaPdfObjectKey;
                  const canRealizar = evento.estado === "SOLICITADO";
                  const canEmitir = evento.estado === "SOLICITADO" || evento.estado === "REALIZADO";
                  const canPagar = evento.estado === "FACTURA_EMITIDA";
                  const hasNonAnularActions =
                    !!onEditar ||
                    (canRealizar && !!onRealizar) ||
                    (canEmitir && !!onEmitir) ||
                    (canPagar && !!onPagar) ||
                    (hasPdf && !!onEliminarPdf);
                  const hasActions =
                    hasNonAnularActions ||
                    !!onAnular;

                  return (
                    <Fragment key={evento.id}>
                      <tr className={cn("border-b transition-colors", isAnulado ? "bg-red-50/30 text-gray-400" : "hover:bg-gray-50/80")}>
                        <td className="px-4 py-4 cursor-pointer text-gray-400 hover:text-gray-600" onClick={() => toggleRow(evento.id)}>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </td>
                        <td className="px-4 py-4 font-medium cursor-pointer whitespace-nowrap" onClick={() => toggleRow(evento.id)}>
                          {evento.fechaEvento}
                        </td>
                        <td className="px-4 py-4 cursor-pointer" onClick={() => toggleRow(evento.id)}>
                          {comedorName}
                        </td>
                        <td className="px-4 py-4 cursor-pointer text-gray-500" onClick={() => toggleRow(evento.id)}>
                          {evento.tipoEventoNombre ?? <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-4 cursor-pointer" onClick={() => toggleRow(evento.id)}>
                          {evento.solicitante ?? <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-4 text-center cursor-pointer" onClick={() => toggleRow(evento.id)}>
                          {evento.cantidadPersonas ?? <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-4 text-right font-mono cursor-pointer" onClick={() => toggleRow(evento.id)}>
                          {evento.montoTotal !== null ? formatCurrency(evento.montoTotal) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-4 text-center cursor-pointer" onClick={() => toggleRow(evento.id)}>
                          {estadoBadge(evento.estado)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {pdfHref ? (
                            <a href={pdfHref} target="_blank" rel="noopener noreferrer" className="inline-flex text-gray-400 hover:text-primary transition-colors">
                              <Paperclip className="h-4 w-4" />
                            </a>
                          ) : hasPdf ? (
                            <span className="inline-flex text-gray-500">
                              <Paperclip className="h-4 w-4" />
                            </span>
                          ) : (
                            <span className="text-gray-200">—</span>
                          )}
                        </td>
                        {!readonly && (
                          <td className="px-4 py-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild disabled={isAnulado || !hasActions}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 data-[state=open]:bg-gray-100 disabled:opacity-30"
                                  aria-label="Acciones"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-lg border-gray-100">
                                {canRealizar && onRealizar && (
                                  <DropdownMenuItem
                                    onClick={() => onRealizar(evento)}
                                    className="gap-2.5 cursor-pointer rounded-lg text-emerald-700 focus:text-emerald-800"
                                  >
                                    <CircleCheckBig className="h-4 w-4" />
                                    Realizado
                                  </DropdownMenuItem>
                                )}
                                {canEmitir && onEmitir && (
                                  <DropdownMenuItem
                                    onClick={() => onEmitir(evento)}
                                    className="gap-2.5 cursor-pointer rounded-lg text-blue-700 focus:text-blue-800"
                                  >
                                    <Send className="h-4 w-4" />
                                    Emitir
                                  </DropdownMenuItem>
                                )}
                                {canPagar && onPagar && (
                                  <DropdownMenuItem
                                    onClick={() => onPagar(evento)}
                                    className="gap-2.5 cursor-pointer rounded-lg text-emerald-700 focus:text-emerald-800"
                                  >
                                    <CircleDollarSign className="h-4 w-4" />
                                    Marcar pagado
                                  </DropdownMenuItem>
                                )}
                                {onEditar && (
                                  <DropdownMenuItem
                                    onClick={() => onEditar(evento)}
                                    className="gap-2.5 cursor-pointer rounded-lg text-gray-700 focus:text-gray-900"
                                  >
                                    <Pencil className="h-4 w-4 text-gray-400" />
                                    Editar
                                  </DropdownMenuItem>
                                )}
                                {hasPdf && onEliminarPdf && (
                                  <DropdownMenuItem
                                    onClick={() => onEliminarPdf(evento)}
                                    className="gap-2.5 cursor-pointer rounded-lg text-amber-700 focus:text-amber-800"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Quitar PDF
                                  </DropdownMenuItem>
                                )}
                                {onAnular && hasNonAnularActions && <DropdownMenuSeparator className="my-1" />}
                                {onAnular && (
                                  <DropdownMenuItem
                                    onClick={() => onAnular(evento)}
                                    className="gap-2.5 cursor-pointer rounded-lg text-red-600 focus:text-red-700 focus:bg-red-50"
                                  >
                                    <Ban className="h-4 w-4" />
                                    Anular
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        )}
                      </tr>

                      {isExpanded && (
                        <tr className="bg-gray-50/60">
                          <td colSpan={readonly ? 9 : 10} className="px-8 py-5">
                            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                              <EventoDetail evento={evento} comedorName={comedorName} />
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
