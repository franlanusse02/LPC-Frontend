import { Fragment, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi } from "@/hooks/useApi";
import { cn, fmtCurrency } from "@/lib/utils";
import { ArrowLeft, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DataTable, SortableTh } from "@/components/data-table";
import { EventosStatusFilter } from "../components/filters/EventosStatusFilter";
import { useTableState } from "@/hooks/useTableState";
import type { EventoResponse } from "@/domain/dto/evento/EventoResponse";
import type { EstadoEvento } from "@/domain/enums/EstadoEvento";
import { EstadoEventoLabel } from "@/domain/enums/EstadoEvento";
import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";

const ESTADO_STYLES: Record<EstadoEvento, { bg: string; text: string }> = {
  SOLICITADO: { bg: "bg-amber-100", text: "text-amber-700" },
  REALIZADO: { bg: "bg-blue-100", text: "text-blue-700" },
  FACTURA_EMITIDA: { bg: "bg-violet-100", text: "text-violet-700" },
  COBRADO: { bg: "bg-emerald-100", text: "text-emerald-700" },
  ANULADO: { bg: "bg-red-100", text: "text-red-600" },
};

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
      <DetailField label="Precio unitario" value={evento.precioUnitario !== null ? fmtCurrency(evento.precioUnitario!) : null} />
      <DetailField label="Monto total" value={evento.montoTotal !== null ? fmtCurrency(evento.montoTotal!) : null} />
      <DetailField label="Centro de costo" value={evento.centroCosto} />
      <DetailField label="Funcionario" value={evento.funcionario} />
      <DetailField label="Oficina" value={evento.oficina} />
      <DetailField label="Responsable" value={evento.responsable} />
      <DetailField label="Empresa" value={evento.empresa} />
      <DetailField label="Dest. facturación" value={evento.destinatarioFactura} />
      <DetailField label="Área" value={evento.area} />
      <DetailField label="Email solicitante" value={evento.emailSolicitante} />
      <DetailField label="Lugar" value={evento.lugar} />
      <DetailField label="Nro. orden / pedido" value={evento.numeroOrden} />
      <DetailField label="Concepto" value={evento.concepto} />
      <DetailField label="Observaciones" value={evento.observaciones} />
    </div>
  );
}

export default function EventosEncargado() {
  const navigate = useNavigate();
  const { get } = useApi();

  const [eventos, setEventos] = useState<EventoResponse[]>([]);
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);

  useEffect(() => {
    Promise.all([get("/eventos/mis-cierres"), get("/comedores")]).then(
      ([eventosRes, comedoresRes]) => {
        eventosRes.json().then((data) => setEventos(Array.isArray(data) ? data : []));
        comedoresRes.json().then(setComedores);
      },
    );
  }, [get]);

  const comedorNameById = useMemo(
    () => Object.fromEntries(comedores.map((c) => [c.id, c.nombre])),
    [comedores],
  );

  const { displayed, sort, expansion, filters } = useTableState(eventos, {
    searchFields: (e) => [
      comedorNameById[e.comedorId] ?? "",
      e.tipoEventoNombre ?? "",
      e.solicitante ?? "",
      e.fechaEvento,
    ],
    statusField: "estado",
    statusMapping: {
      SOLICITADO: { filter: (e) => e.estado === "SOLICITADO" },
      REALIZADO: { filter: (e) => e.estado === "REALIZADO" },
      FACTURA_EMITIDA: { filter: (e) => e.estado === "FACTURA_EMITIDA" },
      COBRADO: { filter: (e) => e.estado === "COBRADO" },
      ANULADO: { filter: (e) => e.estado === "ANULADO" },
    },
    defaultSortKey: "fechaEvento",
  });

  const sortProps = { sortKey: sort.key, sortDir: sort.dir, onSort: sort.handleSort };

  return (
    <div className="px-18 py-8">
      <div className="max-w-2/3 mx-auto">
        <Button variant="ghost" onClick={() => navigate("/encargado")}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>
      <Card className="mx-auto max-w-2/3 py-6 border-0 shadow-md rounded-xl">
        <CardHeader className="border-b px-6 py-4">
          <div className="w-full flex flex-row justify-between">
            <CardTitle className="text-xl font-bold text-gray-800">Tus Eventos</CardTitle>
            <Button
              size="sm"
              onClick={() => navigate("/encargado/eventos/nuevo")}
              className="gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-wide hover:scale-105 transition"
            >
              <Plus className="h-4 w-4" /> Nuevo Evento
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            displayedCount={displayed.length}
            toolbarLeft={
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => filters.setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="h-8 w-52 pl-3 pr-8 text-sm bg-gray-50 border border-gray-200 rounded-md"
                />
                <EventosStatusFilter
                  value={filters.status as "all" | EstadoEvento}
                  onChange={filters.setStatus}
                />
              </div>
            }
            columns={
              <>
                <th className="px-4 py-3 w-8" />
                <SortableTh label="Fecha" col="fechaEvento" {...sortProps} />
                <th className="px-4 py-3">Comedor</th>
                <th className="px-4 py-3">Tipo evento</th>
                <th className="px-4 py-3">Solicitante</th>
                <th className="px-4 py-3 text-right">Personas</th>
                <SortableTh label="Monto" col="montoTotal" {...sortProps} className="text-right" />
                <th className="px-4 py-3 text-center">Estado</th>
              </>
            }
            rows={
              <>
                {displayed.map((evento) => {
                  const isExpanded = expansion.expandedRows.has(evento.id);
                  const estilos = ESTADO_STYLES[evento.estado];
                  const isAnulado = evento.estado === "ANULADO";
                  const comedorName = comedorNameById[evento.comedorId] ?? String(evento.comedorId);

                  return (
                    <Fragment key={evento.id}>
                      <tr
                        className={cn(
                          "border-b transition-colors",
                          isAnulado ? "bg-red-50/30 text-gray-400" : "hover:bg-gray-50/80",
                        )}
                      >
                        <td
                          className="px-4 py-4 cursor-pointer text-gray-400 hover:text-gray-600"
                          onClick={() => expansion.toggleRow(evento.id)}
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </td>
                        <td className="px-4 py-4 font-medium whitespace-nowrap cursor-pointer" onClick={() => expansion.toggleRow(evento.id)}>
                          {evento.fechaEvento}
                        </td>
                        <td className="px-4 py-4 cursor-pointer" onClick={() => expansion.toggleRow(evento.id)}>
                          {comedorName}
                        </td>
                        <td className="px-4 py-4 cursor-pointer" onClick={() => expansion.toggleRow(evento.id)}>
                          {evento.tipoEventoNombre ?? <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-4 cursor-pointer" onClick={() => expansion.toggleRow(evento.id)}>
                          {evento.solicitante ?? <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-4 text-right font-mono cursor-pointer" onClick={() => expansion.toggleRow(evento.id)}>
                          {evento.cantidadPersonas?.toLocaleString("es-AR") ?? <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-4 text-right font-mono cursor-pointer" onClick={() => expansion.toggleRow(evento.id)}>
                          {evento.montoTotal !== null ? fmtCurrency(evento.montoTotal) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-4 text-center cursor-pointer" onClick={() => expansion.toggleRow(evento.id)}>
                          <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", estilos.bg, estilos.text)}>
                            {EstadoEventoLabel[evento.estado]}
                          </span>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-gray-50/60">
                          <td colSpan={8} className="px-8 py-5">
                            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                              <EventoDetail evento={evento} comedorName={comedorName} />
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
        </CardContent>
      </Card>
    </div>
  );
}
