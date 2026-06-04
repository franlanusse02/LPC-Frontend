import { Fragment, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import { ArrowLeft, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DataTable, SortableTh } from "@/components/data-table";
import { EventosStatusFilter } from "../components/filters/EventosStatusFilter";
import { useTableState } from "@/hooks/useTableState";
import type { EventoResponse } from "@/domain/dto/evento/EventoResponse";
import type { EstadoEvento } from "@/domain/enums/EstadoEvento";
import { EstadoEventoLabel } from "@/domain/enums/EstadoEvento";
import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";
import type { ComedorCaseKey } from "../config/comedorCases";

type TabKey = "TODOS" | ComedorCaseKey;

const TAB_LABELS: Record<TabKey, string> = {
  TODOS: "Todos",
  DEFAULT: "Otros",
  GALICIA: "Galicia",
  BBVA: "BBVA",
  TECHINT: "Techint",
  UDESA: "UDESA",
};

const TAB_ORDER: TabKey[] = ["TODOS", "GALICIA", "BBVA", "TECHINT", "UDESA", "DEFAULT"];

const ESTADO_STYLES: Record<EstadoEvento, { bg: string; text: string }> = {
  SOLICITADO: { bg: "bg-amber-100", text: "text-amber-700" },
  REALIZADO: { bg: "bg-blue-100", text: "text-blue-700" },
  FACTURA_EMITIDA: { bg: "bg-violet-100", text: "text-violet-700" },
  COBRADO: { bg: "bg-emerald-100", text: "text-emerald-700" },
  ANULADO: { bg: "bg-red-100", text: "text-red-600" },
};

const ev = (e: EventoResponse, k: string): unknown => (e as Record<string, unknown>)[k];

function extraHeaders(tab: TabKey): ReactNode {
  switch (tab) {
    case "GALICIA":
      return (
        <>
          <th className="px-4 py-3">Solicitante</th>
          <th className="px-4 py-3">Funcionario</th>
          <th className="px-4 py-3">Centro Costo</th>
        </>
      );
    case "BBVA":
      return (
        <>
          <th className="px-4 py-3">Solicitante</th>
          <th className="px-4 py-3">Legajo</th>
          <th className="px-4 py-3">Recepción</th>
        </>
      );
    case "TECHINT":
      return (
        <>
          <th className="px-4 py-3">Nro. Pedido</th>
          <th className="px-4 py-3">Razón Social</th>
        </>
      );
    case "UDESA":
      return (
        <>
          <th className="px-4 py-3">Solicitante</th>
          <th className="px-4 py-3">Centro Costo</th>
          <th className="px-4 py-3">Área</th>
        </>
      );
    default:
      return null;
  }
}

function extraCells(evento: EventoResponse): ReactNode {
  const click = "px-4 py-4 cursor-pointer";
  const dash = <span className="text-gray-300">—</span>;
  switch (evento.tipoComedor) {
    case "GALICIA":
      return (
        <>
          <td className={click}>{evento.solicitanteNombre ?? dash}</td>
          <td className={click}>{evento.funcionarioNombre ?? dash}</td>
          <td className={click}>{evento.centroCosto ?? dash}</td>
        </>
      );
    case "BBVA":
      return (
        <>
          <td className={click}>{evento.solicitanteNombre ?? dash}</td>
          <td className={click}>{evento.legajo ?? dash}</td>
          <td className={click}>{evento.recepcion ?? dash}</td>
        </>
      );
    case "TECHINT":
      return (
        <>
          <td className={click}>{evento.numeroPedido ?? dash}</td>
          <td className={click}>{evento.razonSocial ?? dash}</td>
        </>
      );
    case "UDESA":
      return (
        <>
          <td className={click}>{evento.solicitanteNombre ?? dash}</td>
          <td className={click}>{evento.centroCosto ?? dash}</td>
          <td className={click}>{evento.area ?? dash}</td>
        </>
      );
    default:
      return null;
  }
}

export default function EventosCargaDatos() {
  const navigate = useNavigate();
  const { get } = useApi();

  const [eventos, setEventos] = useState<EventoResponse[]>([]);
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("TODOS");

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

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { TODOS: eventos.length };
    for (const e of eventos) {
      counts[e.tipoComedor] = (counts[e.tipoComedor] || 0) + 1;
    }
    return counts;
  }, [eventos]);

  const availableTabs = useMemo(
    () => TAB_ORDER.filter((k) => k === "TODOS" || (tabCounts[k] ?? 0) > 0),
    [tabCounts],
  );

  const eventosForTab = useMemo(() => {
    if (activeTab === "TODOS") return eventos;
    return eventos.filter((e) => e.tipoComedor === activeTab);
  }, [eventos, activeTab]);

  const hasExtraCols = activeTab !== "TODOS" && activeTab !== "DEFAULT";

  const { displayed, sort, expansion, filters } = useTableState(eventosForTab, {
    searchFields: (e) => [
      comedorNameById[e.comedorId] ?? "",
      e.fechaEvento,
      String(ev(e, "solicitanteNombre") ?? ""),
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
    <div className="px-4 sm:px-8 lg:px-18 py-8">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/carga-datos")}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>
      <Card className="mx-auto max-w-7xl py-6 border-0 shadow-md rounded-xl">
        <CardHeader className="border-b px-6 py-4">
          <div className="w-full flex flex-row justify-between">
            <CardTitle className="text-xl font-bold text-gray-800">Tus Eventos</CardTitle>
            <Button
              size="sm"
              onClick={() => navigate("/carga-datos/eventos/nuevo")}
              className="gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-wide hover:scale-105 transition"
            >
              <Plus className="h-4 w-4" /> Nuevo Evento
            </Button>
          </div>
          {availableTabs.length > 2 && (
            <div className="flex gap-1 pt-3 border-t mt-3 overflow-x-auto">
              {availableTabs.map((tab) => (
                <button
                  type="button"
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors",
                    activeTab === tab
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
                  )}
                >
                  {TAB_LABELS[tab]}
                  <span className="ml-1.5 text-xs opacity-70">({tabCounts[tab] ?? 0})</span>
                </button>
              ))}
            </div>
          )}
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
                {hasExtraCols && extraHeaders(activeTab)}
                <th className="px-4 py-3 text-right">Personas</th>
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
                        {hasExtraCols && extraCells(evento)}
                        <td className="px-4 py-4 text-right font-mono cursor-pointer" onClick={() => expansion.toggleRow(evento.id)}>
                          {evento.cantidadPersonas?.toLocaleString("es-AR") ?? <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-4 text-center cursor-pointer" onClick={() => expansion.toggleRow(evento.id)}>
                          <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", estilos.bg, estilos.text)}>
                            {EstadoEventoLabel[evento.estado]}
                          </span>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-gray-50/60">
                          <td colSpan={20} className="px-8 py-5">
                            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                              <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Comedor</span>
                                  <span className="text-sm text-gray-700">{comedorName}</span>
                                </div>
                                {evento.cantidadPersonas !== null && evento.cantidadPersonas !== undefined && (
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Cantidad personas</span>
                                    <span className="text-sm text-gray-700">{evento.cantidadPersonas}</span>
                                  </div>
                                )}
                                {evento.medioPago && (
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Medio de pago</span>
                                    <span className="text-sm text-gray-700">{evento.medioPago}</span>
                                  </div>
                                )}
                                {evento.observaciones && (
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Observaciones</span>
                                    <span className="text-sm text-gray-700">{evento.observaciones}</span>
                                  </div>
                                )}
                              </div>
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
