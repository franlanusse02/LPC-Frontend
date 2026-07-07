import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi } from "@/hooks/useApi";
import { cn, fmtCurrency } from "@/lib/utils";
import { ArrowLeft, Ban, ChevronDown, ChevronUp, Download, MoreHorizontal, Pencil, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DataTable, SortableTh } from "@/components/data-table";
import { Pagination } from "@/components/Pagination";
import { EventosStatusFilter } from "../components/filters/EventosStatusFilter";
import { useExpandableRows } from "@/hooks/useExpandableRows";
import { exportToXlsx, type ExportColumn } from "@/lib/exportXlsx";
import type { EventoResponse } from "@/domain/dto/evento/EventoResponse";
import type { EventoStatsResponse } from "@/domain/dto/evento/EventoStatsResponse";
import type { Page } from "@/domain/dto/shared/Page";
import type { EstadoEvento } from "@/domain/enums/EstadoEvento";
import { EstadoEventoLabel } from "@/domain/enums/EstadoEvento";
import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";
import type { ComedorCaseKey } from "../config/comedorCases";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AnularEventoModal } from "../components/AnularEventoModal";
import { toast } from "sonner";
import { StatCard } from "@/modules/cierres/components/CierreStat";
import { ListFilters, type ListFilterState } from "@/components/ListFilters";
import { defaultFilters } from "@/components/list-filter-defaults";
import { buildQuery } from "@/lib/query-string";

type TabKey = "TODOS" | ComedorCaseKey;
type StatusFilter = "all" | EstadoEvento;

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
  CARGA_PARCIAL: { bg: "bg-gray-100", text: "text-gray-600" },
  SOLICITADO: { bg: "bg-amber-100", text: "text-amber-700" },
  REALIZADO: { bg: "bg-blue-100", text: "text-blue-700" },
  FACTURA_EMITIDA: { bg: "bg-violet-100", text: "text-violet-700" },
  COBRADO: { bg: "bg-emerald-100", text: "text-emerald-700" },
  ANULADO: { bg: "bg-red-100", text: "text-red-600" },
};

const dash = <span className="text-gray-300">—</span>;
const ev = (e: EventoResponse, k: string): unknown => (e as Record<string, unknown>)[k];

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
      <DetailField label="Cantidad personas" value={evento.cantidadPersonas} />
      <DetailField label="Monto total" value={evento.montoTotal !== null ? fmtCurrency(evento.montoTotal) : null} />
      <DetailField label="Medio de pago" value={evento.medioPago} />
      <DetailField label="Observaciones" value={evento.observaciones} />

      {evento.tipoComedor === "GALICIA" && (
        <>
          <DetailField label="Solicitante" value={evento.solicitanteNombre} />
          <DetailField label="Email solicitante" value={evento.emailSolicitante} />
          <DetailField label="Funcionario" value={evento.funcionarioNombre} />
          <DetailField label="Responsable" value={evento.responsableNombre} />
          <DetailField label="Centro de costo" value={evento.centroCosto} />
          <DetailField label="Partida" value={evento.partida} />
          <DetailField label="Precio unitario" value={evento.precioUnitario !== null ? fmtCurrency(evento.precioUnitario) : null} />
          <DetailField label="Retenciones" value={evento.retenciones !== null ? fmtCurrency(evento.retenciones) : null} />
          <DetailField label="Nro. operación" value={evento.numeroOperacion} />
          <DetailField label="Razón social" value={evento.razonSocial} />
          <DetailField label="Dest. facturación" value={evento.destinatarioFacturacion} />
          <DetailField label="Tipo comprobante" value={evento.tipoComprobante} />
          <DetailField label="Nro. comprobante" value={evento.numeroComprobante} />
        </>
      )}

      {evento.tipoComedor === "BBVA" && (
        <>
          <DetailField label="Solicitante" value={evento.solicitanteNombre} />
          <DetailField label="Email solicitante" value={evento.emailSolicitante} />
          <DetailField label="Orden de compra" value={evento.ordenCompra} />
          <DetailField label="Legajo" value={evento.legajo} />
          <DetailField label="Recepción" value={evento.recepcion} />
        </>
      )}

      {evento.tipoComedor === "TECHINT" && (
        <>
          <DetailField label="Nro. pedido" value={evento.numeroPedido} />
          <DetailField label="Razón social" value={evento.razonSocial} />
          <DetailField label="Concepto" value={evento.concepto} />
          <DetailField label="Tipo comprobante" value={evento.tipoComprobante} />
          <DetailField label="Nro. comprobante" value={evento.numeroComprobante} />
        </>
      )}

      {evento.tipoComedor === "UDESA" && (
        <>
          <DetailField label="Solicitante" value={evento.solicitanteNombre} />
          <DetailField label="Centro de costo" value={evento.centroCosto} />
          <DetailField label="Área" value={evento.area} />
          <DetailField label="Precio unitario" value={evento.precioUnitario !== null ? fmtCurrency(evento.precioUnitario) : null} />
          <DetailField label="Adicionales" value={evento.adicionales !== null ? fmtCurrency(evento.adicionales) : null} />
        </>
      )}

      {evento.servicios.length > 0 && (
        <div className="col-span-full mt-2">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Servicios</span>
          <div className="mt-1 space-y-1">
            {evento.servicios.map((s, i) => (
              <div key={i} className="text-sm text-gray-700">
                {s.producto.nombre} x{s.cantidad} — {fmtCurrency(s.precioUnitario * s.cantidad)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function extraHeaders(tab: TabKey): ReactNode {
  switch (tab) {
    case "GALICIA":
      return (
        <>
          <th className="px-4 py-3">Solicitante</th>
          <th className="px-4 py-3">Funcionario</th>
          <th className="px-4 py-3">Centro Costo</th>
          <th className="px-4 py-3">Partida</th>
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
          <th className="px-4 py-3 text-right">P. Unitario</th>
        </>
      );
    default:
      return null;
  }
}

function extraCells(evento: EventoResponse): ReactNode {
  const click = "px-4 py-4 cursor-pointer";
  switch (evento.tipoComedor) {
    case "GALICIA":
      return (
        <>
          <td className={click}>{evento.solicitanteNombre ?? dash}</td>
          <td className={click}>{evento.funcionarioNombre ?? dash}</td>
          <td className={click}>{evento.centroCosto ?? dash}</td>
          <td className={click}>{evento.partida ?? dash}</td>
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
          <td className={cn(click, "text-right font-mono")}>{evento.precioUnitario !== null ? fmtCurrency(evento.precioUnitario) : dash}</td>
        </>
      );
    default:
      return null;
  }
}

export default function EventosEncargado() {
  const navigate = useNavigate();
  const { get, patch } = useApi();

  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("TODOS");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [listFilters, setListFiltersRaw] = useState<ListFilterState>(defaultFilters);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [sortKey, setSortKey] = useState("fechaEvento");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [pageData, setPageData] = useState<Page<EventoResponse> | null>(null);
  const [stats, setStats] = useState<EventoStatsResponse | null>(null);

  const eventos = pageData?.content ?? [];

  const [anularModalOpen, setAnularModalOpen] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState<EventoResponse | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    get("/comedores").then((r) => r.json()).then(setComedores);
  }, [get]);

  const comedorNameById = useMemo(
    () => Object.fromEntries(comedores.map((c) => [c.id, c.nombre])),
    [comedores],
  );

  const handleFiltersChange = (next: ListFilterState) => {
    setListFiltersRaw(next);
    setPage(0);
  };

  const handleStatusChange = (next: StatusFilter) => {
    setStatusFilter(next);
    setPage(0);
  };

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setPage(0);
  };

  const handleSizeChange = (next: number) => {
    setSize(next);
    setPage(0);
  };

  const handleSort = (key: string) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  };

  const fetchList = useCallback(() => {
    const qs = buildQuery({
      puntoDeVentaIds: listFilters.puntoDeVentaIds,
      comedorId: listFilters.comedorId || undefined,
      estado: statusFilter === "all" ? undefined : statusFilter,
      tipoComedor: activeTab === "TODOS" ? undefined : activeTab,
      fechaInicio: listFilters.desde,
      fechaFin: listFilters.hasta,
      search: search || undefined,
      page,
      size,
      sort: `${sortKey},${sortDir}`,
    });
    return get(`/eventos/mis-cierres${qs}`).then((r) => r.json()).then(setPageData);
  }, [get, listFilters.puntoDeVentaIds, listFilters.comedorId, listFilters.desde, listFilters.hasta, statusFilter, activeTab, search, page, size, sortKey, sortDir]);

  const fetchStats = useCallback(() => {
    const qs = buildQuery({
      puntoDeVentaIds: listFilters.puntoDeVentaIds,
      comedorId: listFilters.comedorId || undefined,
      tipoComedor: activeTab === "TODOS" ? undefined : activeTab,
      fechaInicio: listFilters.desde,
      fechaFin: listFilters.hasta,
      search: search || undefined,
    });
    return get(`/eventos/mis-cierres/stats${qs}`).then((r) => r.json()).then(setStats);
  }, [get, listFilters.puntoDeVentaIds, listFilters.comedorId, listFilters.desde, listFilters.hasta, activeTab, search]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { TODOS: stats?.total ?? 0 };
    for (const [tipo, count] of Object.entries(stats?.countsByTipo ?? {})) {
      counts[tipo] = count;
    }
    return counts;
  }, [stats]);

  const availableTabs = useMemo(
    () => TAB_ORDER.filter((k) => k === "TODOS" || (tabCounts[k] ?? 0) > 0 || k === activeTab),
    [tabCounts, activeTab],
  );

  const hasExtraCols = activeTab !== "TODOS" && activeTab !== "DEFAULT";

  const sortProps = { sortKey, sortDir, onSort: handleSort };

  const expansion = useExpandableRows();

  const isFiltered = !!stats && stats.montoTotalActivo !== stats.montoFiltradoActivo;

  const handleAnular = async (eventoId: number, motivo: string) => {
    try {
      await patch(`/eventos/${eventoId}/anular`, { motivo });
      toast("Evento anulado");
      fetchList();
      fetchStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo anular el evento");
    } finally {
      setSelectedEvento(null);
      setAnularModalOpen(false);
    }
  };

  const exportColumns: ExportColumn<EventoResponse>[] = [
    { key: "fechaEvento", header: "Fecha" },
    { key: (e) => comedorNameById[e.comedorId] ?? e.comedorId, header: "Comedor" },
    { key: "tipoComedor", header: "Tipo" },
    { key: "cantidadPersonas", header: "Personas" },
    { key: "montoTotal", header: "Monto" },
    { key: (e) => EstadoEventoLabel[e.estado], header: "Estado" },
    { key: "medioPago", header: "Medio de Pago" },
    { key: (e) => ev(e, "solicitanteNombre"), header: "Solicitante" },
    { key: (e) => ev(e, "emailSolicitante"), header: "Email Solicitante" },
    { key: (e) => ev(e, "funcionarioNombre"), header: "Funcionario" },
    { key: (e) => ev(e, "responsableNombre"), header: "Responsable" },
    { key: (e) => ev(e, "centroCosto"), header: "Centro de Costo" },
    { key: (e) => ev(e, "partida"), header: "Partida" },
    { key: (e) => ev(e, "area"), header: "Área" },
    { key: (e) => ev(e, "legajo"), header: "Legajo" },
    { key: (e) => ev(e, "recepcion"), header: "Recepción" },
    { key: (e) => ev(e, "ordenCompra"), header: "Orden de Compra" },
    { key: (e) => ev(e, "numeroPedido"), header: "Nº Pedido" },
    { key: (e) => ev(e, "concepto"), header: "Concepto" },
    { key: (e) => ev(e, "razonSocial"), header: "Razón Social" },
    { key: (e) => ev(e, "destinatarioFacturacion"), header: "Dest. Facturación" },
    { key: (e) => ev(e, "tipoComprobante"), header: "Tipo Comprobante" },
    { key: (e) => ev(e, "numeroComprobante"), header: "Nº Comprobante" },
    { key: (e) => ev(e, "numeroOperacion"), header: "Nº Operación" },
    { key: (e) => ev(e, "precioUnitario"), header: "Precio Unitario" },
    { key: (e) => ev(e, "retenciones"), header: "Retenciones" },
    { key: (e) => ev(e, "adicionales"), header: "Adicionales" },
    { key: "observaciones", header: "Observaciones" },
  ];

  const handleExport = () => {
    const data = eventos.filter((e) => e.estado !== "CARGA_PARCIAL");
    const segments = ["mis-eventos"];
    if (activeTab !== "TODOS") segments.push(activeTab.toLowerCase());
    if (statusFilter !== "all") segments.push(statusFilter);
    exportToXlsx({ data, columns: exportColumns, filename: segments.join("-") });
  };

  return (
    <div className="px-4 sm:px-8 lg:px-18 py-8">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/encargado")}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>

      <div className="mx-auto max-w-7xl grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 pb-4">
        <StatCard label="Total eventos" value={stats?.total ?? 0} />
        <StatCard label="Activos" value={stats?.activos ?? 0} accent="emerald" />
        <StatCard label="Anulados" value={stats?.anulados ?? 0} accent="red" />
        <StatCard label="Monto total" value={fmtCurrency(stats?.montoTotalActivo ?? 0)} />
        <StatCard
          label={isFiltered ? "Monto filtrado" : "Monto activo"}
          value={fmtCurrency(stats?.montoFiltradoActivo ?? 0)}
          accent={isFiltered ? "blue" : undefined}
        />
      </div>

      <Card className="mx-auto max-w-7xl py-6 border-0 shadow-md rounded-xl">
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
          <div className="pt-3">
            <ListFilters
              filters={listFilters}
              onChange={handleFiltersChange}
              comedores={comedores}
              showSociedad={false}
            />
          </div>
          {availableTabs.length > 2 && (
            <div className="flex gap-1 pt-3 border-t mt-3 overflow-x-auto">
              {availableTabs.map((tab) => (
                <button
                  type="button"
                  key={tab}
                  onClick={() => handleTabChange(tab)}
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
            displayedCount={pageData?.numberOfElements ?? 0}
            toolbarLeft={
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Buscar..."
                  className="h-8 w-52 pl-3 pr-8 text-sm bg-gray-50 border border-gray-200 rounded-md"
                />
                <EventosStatusFilter
                  value={statusFilter}
                  onChange={handleStatusChange}
                />
              </div>
            }
            toolbarRight={
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="size-4 mr-1.5" />
                Exportar Excel
              </Button>
            }
            columns={
              <>
                <th className="px-4 py-3 w-8" />
                <SortableTh label="Fecha" col="fechaEvento" {...sortProps} />
                <th className="px-4 py-3">Comedor</th>
                {hasExtraCols && extraHeaders(activeTab)}
                <th className="px-4 py-3 text-right">Personas</th>
                <SortableTh label="Monto" col="montoTotal" {...sortProps} className="text-right" />
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 w-12" />
              </>
            }
            rows={
              <>
                {eventos.map((evento) => {
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
                          {evento.cantidadPersonas?.toLocaleString("es-AR") ?? dash}
                        </td>
                        <td className="px-4 py-4 text-right font-mono cursor-pointer" onClick={() => expansion.toggleRow(evento.id)}>
                          {evento.montoTotal !== null ? fmtCurrency(evento.montoTotal) : dash}
                        </td>
                        <td className="px-4 py-4 text-center cursor-pointer" onClick={() => expansion.toggleRow(evento.id)}>
                          <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", estilos.bg, estilos.text)}>
                            {EstadoEventoLabel[evento.estado]}
                          </span>
                        </td>
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          {(evento.estado === "CARGA_PARCIAL" || evento.estado === "SOLICITADO") && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 data-[state=open]:bg-gray-100"
                                  aria-label="Acciones"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-lg border-gray-100">
                                <DropdownMenuItem
                                  onClick={() => navigate(`/encargado/eventos/${evento.id}/editar`)}
                                  className="gap-2.5 cursor-pointer rounded-lg text-gray-700 focus:text-gray-900"
                                >
                                  <Pencil className="h-4 w-4 text-gray-400" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-1" />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedEvento(evento);
                                    setAnularModalOpen(true);
                                  }}
                                  className="gap-2.5 cursor-pointer rounded-lg text-red-600 focus:text-red-700 focus:bg-red-50"
                                >
                                  <Ban className="h-4 w-4" /> Anular
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-gray-50/60">
                          <td colSpan={20} className="px-8 py-5">
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
          <Pagination
            page={pageData?.number ?? 0}
            size={pageData?.size ?? size}
            totalPages={pageData?.totalPages ?? 0}
            totalElements={pageData?.totalElements ?? 0}
            onPageChange={setPage}
            onSizeChange={handleSizeChange}
          />
        </CardContent>
      </Card>
      <AnularEventoModal
        open={anularModalOpen}
        onClose={() => setAnularModalOpen(false)}
        evento={selectedEvento}
        onConfirm={handleAnular}
      />
    </div>
  );
}
