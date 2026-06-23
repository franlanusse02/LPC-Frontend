import { Fragment } from "react";
import {
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  MoreHorizontal,
  Pencil,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, SortableTh } from "@/components/data-table";
import { OrdenesStatusFilter } from "./filters/OrdenesStatusFilter";
import { useTableState } from "@/hooks/useTableState";
import { cn, fmtCurrency } from "@/lib/utils";
import { EstadoOrdenStyles } from "@/domain/enums/EstadoOrden";
import type { OrdenDeCompraResponse } from "@/domain/dto/orden-compra/OrdenDeCompraResponse";

interface Props {
  ordenes: OrdenDeCompraResponse[];
  onDownloadPdf: (o: OrdenDeCompraResponse) => void;
  onEdit?: (o: OrdenDeCompraResponse) => void;
  onAprobar?: (o: OrdenDeCompraResponse) => void;
  onEnviar?: (o: OrdenDeCompraResponse) => void;
  onCancelar?: (o: OrdenDeCompraResponse) => void;
}

export function OrdenesDeCompraTable({
  ordenes,
  onDownloadPdf,
  onEdit,
  onAprobar,
  onEnviar,
  onCancelar,
}: Props) {
  const hasActions = !!(onEdit || onAprobar || onEnviar || onCancelar);

  const { displayed, sort, expansion, filters } = useTableState(ordenes, {
    searchFields: (o) => [
      o.nroOrden.toLowerCase(),
      o.proveedorNombre.toLowerCase(),
      o.comedorName.toLowerCase(),
      o.solicitante.toLowerCase(),
    ],
    statusField: "estado",
    statusMapping: {
      PENDIENTE: { filter: (o) => o.estado === "PENDIENTE" },
      APROBADA: { filter: (o) => o.estado === "APROBADA" },
      ENVIADA: { filter: (o) => o.estado === "ENVIADA" },
      CANCELADA: { filter: (o) => o.estado === "CANCELADA" },
    },
    defaultSortKey: "fecha" as const,
  });

  const sortProps = { sortKey: sort.key, sortDir: sort.dir, onSort: sort.handleSort };

  return (
    <DataTable
      displayedCount={displayed.length}
      toolbarLeft={
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={filters.search}
            onChange={(e) => filters.setSearch(e.target.value)}
            placeholder="Buscar..."
            className="h-8 w-52 pl-3 pr-3 text-sm bg-gray-50 border border-gray-200 rounded-md"
          />
          <OrdenesStatusFilter
            value={filters.status as "all" | "PENDIENTE" | "APROBADA" | "ENVIADA" | "CANCELADA"}
            onChange={filters.setStatus}
          />
        </div>
      }
      columns={
        <>
          <th className="px-4 py-3 w-8" />
          <SortableTh label="Nº Orden" col="nroOrden" {...sortProps} />
          <SortableTh label="Fecha" col="fecha" {...sortProps} />
          <th className="px-4 py-3">Proveedor</th>
          <th className="px-4 py-3">Sucursal</th>
          <SortableTh label="Total" col="total" {...sortProps} className="text-right" />
          <SortableTh label="Estado" col="estado" {...sortProps} />
          <th className="px-4 py-3 w-12">Acciones</th>
        </>
      }
      rows={
        <>
          {displayed.map((orden) => {
            const isExpanded = expansion.expandedRows.has(orden.id);
            const isCancelada = orden.estado === "CANCELADA";
            const styles = EstadoOrdenStyles[orden.estado];
            const showEdit = onEdit && orden.estado === "PENDIENTE";
            const showAprobar = onAprobar && orden.estado === "PENDIENTE";
            const showEnviar = onEnviar && orden.estado === "APROBADA";
            const showCancelar = onCancelar && orden.estado === "PENDIENTE";
            const showDropdown = hasActions && (showEdit || showAprobar || showEnviar || showCancelar);

            return (
              <Fragment key={orden.id}>
                <tr
                  className={cn(
                    "border-b transition-colors",
                    isCancelada ? "bg-red-50/30 text-gray-400" : "hover:bg-gray-50/80",
                  )}
                >
                  <td
                    className="px-4 py-4 cursor-pointer text-gray-400 hover:text-gray-600"
                    onClick={() => expansion.toggleRow(orden.id)}
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </td>
                  <td className="px-4 py-4 font-medium whitespace-nowrap cursor-pointer" onClick={() => expansion.toggleRow(orden.id)}>
                    {orden.nroOrden}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap cursor-pointer" onClick={() => expansion.toggleRow(orden.id)}>
                    {orden.fecha}
                  </td>
                  <td className="px-4 py-4 cursor-pointer" onClick={() => expansion.toggleRow(orden.id)}>
                    {orden.proveedorNombre}
                  </td>
                  <td className="px-4 py-4 cursor-pointer" onClick={() => expansion.toggleRow(orden.id)}>
                    {orden.comedorName}
                  </td>
                  <td className="px-4 py-4 text-right font-mono cursor-pointer" onClick={() => expansion.toggleRow(orden.id)}>
                    {fmtCurrency(orden.total)}
                  </td>
                  <td className="px-4 py-4 cursor-pointer" onClick={() => expansion.toggleRow(orden.id)}>
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", styles.bg, styles.text)}>
                      {isCancelada && <Ban className="h-3 w-3" />}
                      {styles.label}
                    </span>
                  </td>
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                        aria-label="Descargar PDF"
                        onClick={() => onDownloadPdf(orden)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {showDropdown && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100" aria-label="Acciones">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-lg border-gray-100">
                            {showEdit && (
                              <DropdownMenuItem onClick={() => onEdit!(orden)} className="gap-2.5 cursor-pointer rounded-lg text-gray-700 focus:text-gray-900">
                                <Pencil className="h-4 w-4 text-gray-400" /> Editar
                              </DropdownMenuItem>
                            )}
                            {showAprobar && (
                              <DropdownMenuItem onClick={() => onAprobar!(orden)} className="gap-2.5 cursor-pointer rounded-lg text-blue-600 focus:text-blue-700 focus:bg-blue-50">
                                <CheckCircle2 className="h-4 w-4" /> Aprobar
                              </DropdownMenuItem>
                            )}
                            {showEnviar && (
                              <DropdownMenuItem onClick={() => onEnviar!(orden)} className="gap-2.5 cursor-pointer rounded-lg text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50">
                                <Send className="h-4 w-4" /> Enviar
                              </DropdownMenuItem>
                            )}
                            {showCancelar && (
                              <>
                                <DropdownMenuSeparator className="my-1" />
                                <DropdownMenuItem onClick={() => onCancelar!(orden)} className="gap-2.5 cursor-pointer rounded-lg text-red-600 focus:text-red-700 focus:bg-red-50">
                                  <Ban className="h-4 w-4" /> Cancelar
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </td>
                </tr>

                {isExpanded && (
                  <tr className="bg-gray-50/60">
                    <td colSpan={8} className="px-8 py-4">
                      <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 lg:grid-cols-4 mb-4">
                        <Field label="Solicitante" value={orden.solicitante} />
                        <Field label="Empresa solicitante" value={orden.sociedadNombre} />
                        <Field label="Fecha estimada entrega" value={orden.fechaEstimadaEntrega} />
                        <Field label="Plazo entrega" value={orden.plazoEntrega} />
                        <Field label="Condición entrega" value={orden.condicionEntrega} />
                        <Field label="Tipo factura" value={orden.tipoFactura} />
                        <Field label="Observaciones" value={orden.observaciones} />
                      </div>

                      <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-100 text-left text-xs uppercase text-gray-500 tracking-wider">
                              <th className="px-4 py-2.5">Código</th>
                              <th className="px-4 py-2.5">Descripción</th>
                              <th className="px-4 py-2.5 text-right">Cantidad</th>
                              <th className="px-4 py-2.5 text-right">Precio unit.</th>
                              <th className="px-4 py-2.5 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {orden.items.map((item, i) => (
                              <tr key={i} className="hover:bg-white transition-colors">
                                <td className="px-4 py-2.5 font-mono text-gray-600">{item.codigo ?? "—"}</td>
                                <td className="px-4 py-2.5 text-gray-700">{item.nombre}</td>
                                <td className="px-4 py-2.5 text-right text-gray-700">{item.cantidad}</td>
                                <td className="px-4 py-2.5 text-right font-mono text-gray-700">{fmtCurrency(item.precioUnitario)}</td>
                                <td className="px-4 py-2.5 text-right font-mono text-gray-700">{fmtCurrency(item.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-3 flex flex-col items-end gap-1 text-sm">
                        <div className="flex w-56 justify-between"><span className="text-gray-500">Subtotal</span><span className="font-mono">{fmtCurrency(orden.subtotal)}</span></div>
                        <div className="flex w-56 justify-between"><span className="text-gray-500">Descuento</span><span className="font-mono">−{fmtCurrency(orden.descuento)}</span></div>
                        <div className="flex w-56 justify-between border-t pt-1 font-semibold"><span>Total</span><span className="font-mono">{fmtCurrency(orden.total)}</span></div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </>
      }
    />
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</span>
      <span className="text-sm text-gray-700">{value}</span>
    </div>
  );
}
