import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { MediosPagoDict } from "@/domain/enums/MedioPago";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApi } from "@/hooks/useApi";
import { cn, fmtCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Download,
  FileX2,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Send,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DataTable, SortableTh } from "@/components/data-table";
import { Pagination } from "@/components/Pagination";
import { EventosStatusFilter } from "../components/filters/EventosStatusFilter";
import { AnularEventoModal } from "../components/AnularEventoModal";
import { RealizarEventoModal } from "../components/RealizarEventoModal";
import {
  EmitirEventoModal,
  type EmitirEventoPayload,
} from "../components/EmitirEventoModal";
import {
  CobrarEventoModal,
  type CobrarEventoPayload,
} from "../components/CobrarEventoModal";
import { toast } from "sonner";
import { useExpandableRows } from "@/hooks/useExpandableRows";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionModal } from "@/components/BulkActionModal";
import { handleBulkResponse } from "@/lib/bulk-utils";
import { StatCard } from "@/modules/cierres/components/CierreStat";
import type { BulkActionResponse } from "@/domain/dto/shared/BulkActionResponse";
import type { Page } from "@/domain/dto/shared/Page";
import type { EventoResponse } from "@/domain/dto/evento/EventoResponse";
import type { EventoStatsResponse } from "@/domain/dto/evento/EventoStatsResponse";
import type { EstadoEvento } from "@/domain/enums/EstadoEvento";
import { EstadoEventoLabel } from "@/domain/enums/EstadoEvento";
import { exportToXlsx, type ExportColumn } from "@/lib/exportXlsx";
import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";
import {
  ListFilters,
  type ListFilterState,
} from "@/components/ListFilters";
import { defaultFilters } from "@/components/list-filter-defaults";
import type { ComedorCaseKey } from "../config/comedorCases";
import { buildQuery } from "@/lib/query-string";
import { useExportAll } from "@/hooks/useExportAll";

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

      {evento.facturaPdfNombreArchivo && (
        <DetailField label="Factura PDF" value={evento.facturaPdfNombreArchivo} />
      )}
    </div>
  );
}

function tabHeaders(tab: TabKey): ReactNode {
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

function tabCells(evento: EventoResponse): ReactNode {
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

const eField = (key: string, header: string): ExportColumn<EventoResponse> => ({
  key: (e) => ev(e, key) as string | number | null,
  header,
});

function buildExportColumns(
  tab: TabKey,
  comedorNameById: Record<number, string>,
): ExportColumn<EventoResponse>[] {
  const fmtDate = (e: EventoResponse) =>
    new Date(e.creadoEn).toLocaleString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    });

  const base: ExportColumn<EventoResponse>[] = [
    { key: fmtDate, header: "Fecha de Carga" },
    { key: "id", header: "ID" },
    { key: (e) => comedorNameById[e.comedorId] ?? e.comedorId, header: "Comedor" },
    { key: "estado", header: "Estado" },
    { key: "fechaEvento", header: "Fecha Evento" },
    { key: "cantidadPersonas", header: "Personas" },
    { key: "montoTotal", header: "Monto Total" },
    { key: "medioPago", header: "Medio de Pago" },
    { key: "fechaEmision", header: "Fecha Emisión" },
    { key: "fechaPago", header: "Fecha Pago" },
    { key: "observaciones", header: "Observaciones" },
    eField("centroCosto", "Centro de Costo"),
    eField("partida", "Partida"),
    { key: (e) => e.servicios.map((s) => `${s.producto.nombre} x${s.cantidad}`).join(", ") || null, header: "Servicios" },
    { key: "actualizadoEn", header: "Actualizado en" },
  ];

  switch (tab) {
    case "GALICIA":
      return [
        ...base,
        eField("solicitanteNombre", "Solicitante"),
        eField("emailSolicitante", "Email Solicitante"),
        eField("funcionarioNombre", "Funcionario"),
        eField("responsableNombre", "Responsable"),
        eField("centroCosto", "Centro de Costo"),
        eField("partida", "Partida"),
        eField("precioUnitario", "Precio Unitario"),
        eField("retenciones", "Retenciones"),
        eField("numeroOperacion", "Nº Operación"),
        eField("razonSocial", "Razón Social"),
        eField("destinatarioFacturacion", "Dest. Facturación"),
        eField("tipoComprobante", "Tipo Comprobante"),
        eField("numeroComprobante", "Nº Comprobante"),
      ];
    case "BBVA":
      return [
        ...base,
        eField("solicitanteNombre", "Solicitante"),
        eField("emailSolicitante", "Email Solicitante"),
        eField("ordenCompra", "Orden de Compra"),
        eField("legajo", "Legajo"),
        eField("recepcion", "Recepción"),
      ];
    case "TECHINT":
      return [
        ...base,
        eField("numeroPedido", "Nº Pedido"),
        eField("razonSocial", "Razón Social"),
        eField("concepto", "Concepto"),
        eField("tipoComprobante", "Tipo Comprobante"),
        eField("numeroComprobante", "Nº Comprobante"),
      ];
    case "UDESA":
      return [
        ...base,
        eField("solicitanteNombre", "Solicitante"),
        eField("centroCosto", "Centro de Costo"),
        eField("area", "Área"),
        eField("precioUnitario", "Precio Unitario"),
        eField("adicionales", "Adicionales"),
      ];
    default:
      return base;
  }
}

export default function EventosContabilidad() {
  const navigate = useNavigate();
  const { get, post, patch } = useApi();

  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("TODOS");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [sortKey, setSortKey] = useState("fechaEvento");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [pageData, setPageData] = useState<Page<EventoResponse> | null>(null);
  const [stats, setStats] = useState<EventoStatsResponse | null>(null);

  const eventos = pageData?.content ?? [];
  const { exporting, fetchAll } = useExportAll<EventoResponse>("/eventos");

  const [selectedEvento, setSelectedEvento] = useState<EventoResponse | null>(null);
  const [anularOpen, setAnularOpen] = useState(false);
  const [realizarOpen, setRealizarOpen] = useState(false);
  const [emitirOpen, setEmitirOpen] = useState(false);
  const [cobrarOpen, setCobrarOpen] = useState(false);

  const [listFilters, setListFiltersRaw] = useState<ListFilterState>({ ...defaultFilters, dateField: "fechaEvento" });

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
    selection.clear();
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
    return get(`/eventos${qs}`).then((r) => r.json()).then(setPageData);
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
    return get(`/eventos/stats${qs}`).then((r) => r.json()).then(setStats);
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

  const isFiltered = !!stats && stats.montoTotalActivo !== stats.montoFiltradoActivo;

  const handleAction = async (action: () => Promise<EventoResponse>) => {
    try {
      await action();
      fetchList();
      fetchStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo completar la operación");
      throw err;
    }
  };

  const handleAnular = async (eventoId: number, motivo: string) => {
    await handleAction(async () => {
      const updated: EventoResponse = await patch(`/eventos/${eventoId}/anular`, { motivo }).then((r) => r.json());
      toast("Evento anulado");
      return updated;
    });
  };

  const handleRealizar = async (eventoId: number) => {
    await handleAction(async () => {
      const updated: EventoResponse = await patch(`/eventos/${eventoId}/realizar`, {}).then((r) => r.json());
      toast("Evento marcado como realizado");
      return updated;
    });
  };

  const handleEmitir = async (eventoId: number, payload: EmitirEventoPayload) => {
    await handleAction(async () => {
      const updated: EventoResponse = await patch(`/eventos/${eventoId}/emitir`, payload).then((r) => r.json());
      toast("Factura de evento emitida");
      return updated;
    });
  };

  const handleCobrar = async (eventoId: number, payload: CobrarEventoPayload) => {
    await handleAction(async () => {
      const updated: EventoResponse = await patch(`/eventos/${eventoId}/pagado`, payload).then((r) => r.json());
      toast("Cobro del evento registrado");
      return updated;
    });
  };

  const handleEliminarPdf = async (eventoId: number) => {
    await handleAction(async () => {
      const updated: EventoResponse = await patch(`/eventos/${eventoId}/eliminar-factura-pdf`, {}).then((r) => r.json());
      toast("PDF eliminado");
      return updated;
    });
  };

  const openModal = (evento: EventoResponse, modal: "anular" | "realizar" | "emitir" | "cobrar") => {
    setSelectedEvento(evento);
    if (modal === "anular") setAnularOpen(true);
    if (modal === "realizar") setRealizarOpen(true);
    if (modal === "emitir") setEmitirOpen(true);
    if (modal === "cobrar") setCobrarOpen(true);
  };

  const expansion = useExpandableRows();
  const selection = useRowSelection();

  const [bulkRealizar, setBulkRealizar] = useState(false);
  const [bulkEmitir, setBulkEmitir] = useState(false);
  const [bulkCobrar, setBulkCobrar] = useState(false);
  const [bulkAnular, setBulkAnular] = useState(false);
  const [bulkMotivo, setBulkMotivo] = useState("");
  const [bulkFechaPago, setBulkFechaPago] = useState("");
  const [bulkMedioPago, setBulkMedioPago] = useState("");
  const [bulkNumeroOp, setBulkNumeroOp] = useState("");

  const selectedEventos = eventos.filter((e) => selection.selected.has(e.id));
  const allSolicitado = selectedEventos.length > 0 && selectedEventos.every((e) => e.estado === "SOLICITADO");
  const allEmitible = selectedEventos.length > 0 && selectedEventos.every((e) => e.estado === "SOLICITADO" || e.estado === "REALIZADO");
  const allFacturaEmitida = selectedEventos.length > 0 && selectedEventos.every((e) => e.estado === "FACTURA_EMITIDA");
  const allAnulable = selectedEventos.length > 0 && selectedEventos.every((e) => e.estado === "SOLICITADO" || e.estado === "REALIZADO" || e.estado === "FACTURA_EMITIDA");

  const selectableIds = eventos
    .filter((e) => e.estado !== "ANULADO" && e.estado !== "COBRADO")
    .map((e) => e.id);

  const handleBulkRealizar = async () => {
    const res = await post("/eventos/bulk/realizar", { ids: [...selection.selected] })
      .then((r) => r.json() as Promise<BulkActionResponse>);
    handleBulkResponse(res, "Realización");
    selection.clear();
    fetchList();
    fetchStats();
  };

  const handleBulkEmitir = async () => {
    const res = await post("/eventos/bulk/emitir", {
      ids: [...selection.selected],
      fechaEmision: null,
      fechaPago: null,
      tipoComprobante: null,
      numeroComprobante: null,
      adjuntarFacturaPdfRequest: null,
    }).then((r) => r.json() as Promise<BulkActionResponse>);
    handleBulkResponse(res, "Emisión");
    selection.clear();
    fetchList();
    fetchStats();
  };

  const handleBulkCobrar = async () => {
    const res = await post("/eventos/bulk/cobrar", {
      ids: [...selection.selected],
      fechaPago: bulkFechaPago || null,
      medioPago: bulkMedioPago || null,
      numeroOperacion: bulkNumeroOp || null,
    }).then((r) => r.json() as Promise<BulkActionResponse>);
    handleBulkResponse(res, "Cobro");
    selection.clear();
    fetchList();
    fetchStats();
    setBulkFechaPago("");
    setBulkMedioPago("");
    setBulkNumeroOp("");
  };

  const handleBulkAnular = async () => {
    const res = await post("/eventos/bulk/anular", {
      ids: [...selection.selected],
      motivo: bulkMotivo,
    }).then((r) => r.json() as Promise<BulkActionResponse>);
    handleBulkResponse(res, "Anulación");
    selection.clear();
    fetchList();
    fetchStats();
    setBulkMotivo("");
  };

  const exportColumns = useMemo(
    () => buildExportColumns(activeTab, comedorNameById),
    [activeTab, comedorNameById],
  );

  const handleExport = async () => {
    const segments = ["eventos"];
    if (activeTab !== "TODOS") segments.push(activeTab.toLowerCase());
    if (statusFilter !== "all") segments.push(statusFilter.toLowerCase());
    if (listFilters.desde) segments.push(`desde-${listFilters.desde}`);
    if (listFilters.hasta) segments.push(`hasta-${listFilters.hasta}`);

    if (selection.count > 0) {
      const data = eventos.filter((e) => selection.selected.has(e.id) && e.estado !== "CARGA_PARCIAL");
      exportToXlsx({ data, columns: exportColumns, filename: segments.join("-") });
      return;
    }

    try {
      const all = await fetchAll({
        puntoDeVentaIds: listFilters.puntoDeVentaIds,
        comedorId: listFilters.comedorId || undefined,
        estado: statusFilter === "all" ? undefined : statusFilter,
        tipoComedor: activeTab === "TODOS" ? undefined : activeTab,
        fechaInicio: listFilters.desde,
        fechaFin: listFilters.hasta,
        search: search || undefined,
      });
      const data = all.filter((e) => e.estado !== "CARGA_PARCIAL");
      exportToXlsx({ data, columns: exportColumns, filename: segments.join("-") });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo exportar");
    }
  };

  return (
    <div className="px-4 sm:px-8 lg:px-18 py-8">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/contabilidad")}>
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
          <CardTitle className="text-xl font-bold text-gray-800">Eventos</CardTitle>
          <div className="flex flex-row items-start justify-between gap-4 pt-3">
            <ListFilters
              filters={listFilters}
              onChange={handleFiltersChange}
              comedores={comedores}
              showSociedad={false}
            />
            <Button
              size="sm"
              onClick={() => navigate("/contabilidad/eventos/nuevo")}
              className="gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-wide hover:scale-105 transition shrink-0"
            >
              <Plus className="h-4 w-4" /> Nuevo Evento
            </Button>
          </div>
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
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            displayedCount={pageData?.numberOfElements ?? 0}
            selectionToolbar={
              selection.count > 0 ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-blue-700">
                    {selection.count} seleccionado{selection.count !== 1 ? "s" : ""}
                  </span>
                  {allSolicitado && (
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setBulkRealizar(true)}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Realizar
                    </Button>
                  )}
                  {allEmitible && (
                    <Button size="sm" variant="outline" className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => setBulkEmitir(true)}>
                      <Send className="h-3.5 w-3.5" /> Emitir
                    </Button>
                  )}
                  {allFacturaEmitida && (
                    <Button size="sm" variant="outline" className="gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => setBulkCobrar(true)}>
                      <CircleDollarSign className="h-3.5 w-3.5" /> Cobrar
                    </Button>
                  )}
                  {allAnulable && (
                    <Button size="sm" variant="outline" className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50" onClick={() => setBulkAnular(true)}>
                      <Ban className="h-3.5 w-3.5" /> Anular
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
                    {exporting ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Download className="size-4 mr-1.5" />}
                    Exportar ({selection.count})
                  </Button>
                  <Button size="sm" variant="ghost" className="text-gray-500 text-xs" onClick={selection.clear}>
                    Deseleccionar
                  </Button>
                </div>
              ) : undefined
            }
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
              <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
                {exporting ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Download className="size-4 mr-1.5" />}
                {selection.count > 0 ? `Exportar (${selection.count})` : "Exportar Excel"}
              </Button>
            }
            columns={
              <>
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={selection.isAllSelected(selectableIds)}
                    onChange={() => selection.toggleAll(selectableIds)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 w-8" />
                <SortableTh label="Fecha" col="fechaEvento" {...sortProps} />
                <th className="px-4 py-3">Comedor</th>
                {hasExtraCols && tabHeaders(activeTab)}
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

                  const canRealizar = evento.estado === "SOLICITADO";
                  const canEmitir = evento.estado === "SOLICITADO" || evento.estado === "REALIZADO";
                  const canCobrar = evento.estado === "FACTURA_EMITIDA";
                  const hasPdf = !!evento.facturaPdfNombreArchivo;
                  const canEliminarPdf = hasPdf && (evento.estado === "FACTURA_EMITIDA" || evento.estado === "COBRADO");

                  return (
                    <Fragment key={evento.id}>
                      <tr
                        className={cn(
                          "border-b transition-colors",
                          isAnulado ? "bg-red-50/30 text-gray-400" : "hover:bg-gray-50/80",
                          selection.selected.has(evento.id) && "bg-blue-50/40",
                        )}
                      >
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selection.selected.has(evento.id)}
                            onChange={() => selection.toggle(evento.id)}
                            disabled={isAnulado || evento.estado === "COBRADO"}
                            className="h-4 w-4 rounded border-gray-300 disabled:opacity-30"
                          />
                        </td>
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
                        {hasExtraCols && tabCells(evento)}
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
                          {!isAnulado && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100" aria-label="Acciones">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-gray-100">
                                {canRealizar && (
                                  <DropdownMenuItem onClick={() => openModal(evento, "realizar")} className="gap-2.5 cursor-pointer rounded-lg">
                                    <CheckCircle2 className="h-4 w-4" /> Realizar
                                  </DropdownMenuItem>
                                )}
                                {canEmitir && (
                                  <DropdownMenuItem onClick={() => openModal(evento, "emitir")} className="gap-2.5 cursor-pointer rounded-lg">
                                    <Send className="h-4 w-4" /> Emitir factura
                                  </DropdownMenuItem>
                                )}
                                {canCobrar && (
                                  <DropdownMenuItem onClick={() => openModal(evento, "cobrar")} className="gap-2.5 cursor-pointer rounded-lg">
                                    <CircleDollarSign className="h-4 w-4" /> Cobrar
                                  </DropdownMenuItem>
                                )}
                                {canEliminarPdf && (
                                  <DropdownMenuItem onClick={() => handleEliminarPdf(evento.id)} className="gap-2.5 cursor-pointer rounded-lg">
                                    <FileX2 className="h-4 w-4" /> Eliminar PDF
                                  </DropdownMenuItem>
                                )}
                                {evento.estado === "SOLICITADO" && (
                                  <DropdownMenuItem
                                    onClick={() => navigate(`/contabilidad/eventos/${evento.id}/editar`)}
                                    className="gap-2.5 cursor-pointer rounded-lg text-gray-700 focus:text-gray-900"
                                  >
                                    <Pencil className="h-4 w-4 text-gray-400" />
                                    Editar
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openModal(evento, "anular")} className="gap-2.5 cursor-pointer rounded-lg text-red-600 focus:text-red-700 focus:bg-red-50">
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

      <AnularEventoModal open={anularOpen} onClose={() => setAnularOpen(false)} evento={selectedEvento} onConfirm={handleAnular} />
      <RealizarEventoModal open={realizarOpen} onClose={() => setRealizarOpen(false)} evento={selectedEvento} onConfirm={handleRealizar} />
      <EmitirEventoModal open={emitirOpen} onClose={() => setEmitirOpen(false)} evento={selectedEvento} onConfirm={handleEmitir} />
      <CobrarEventoModal open={cobrarOpen} onClose={() => setCobrarOpen(false)} evento={selectedEvento} onConfirm={handleCobrar} />

      <BulkActionModal
        open={bulkRealizar}
        onClose={() => setBulkRealizar(false)}
        title="Realizar eventos"
        description="Se marcarán como realizados"
        confirmLabel="Realizar"
        confirmColor="blue"
        count={selection.count}
        onConfirm={handleBulkRealizar}
      />

      <BulkActionModal
        open={bulkEmitir}
        onClose={() => setBulkEmitir(false)}
        title="Emitir factura"
        description="Se emitirá factura para"
        confirmLabel="Emitir"
        confirmColor="blue"
        count={selection.count}
        onConfirm={handleBulkEmitir}
      />

      <BulkActionModal
        open={bulkCobrar}
        onClose={() => setBulkCobrar(false)}
        title="Cobrar eventos"
        description="Se registrará el cobro de"
        confirmLabel="Cobrar"
        confirmColor="emerald"
        count={selection.count}
        onConfirm={handleBulkCobrar}
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Fecha pago</label>
            <Input type="date" value={bulkFechaPago} onChange={(e) => setBulkFechaPago(e.target.value)} className="bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Medio de pago</label>
            <Combobox
              options={Object.entries(MediosPagoDict).map(([label, value]) => ({ value, label }))}
              value={bulkMedioPago}
              onChange={setBulkMedioPago}
              placeholder="Seleccionar medio de pago..."
              className="w-full"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Nº operación</label>
            <Input value={bulkNumeroOp} onChange={(e) => setBulkNumeroOp(e.target.value)} className="bg-card" placeholder="Opcional" />
          </div>
        </div>
      </BulkActionModal>

      <BulkActionModal
        open={bulkAnular}
        onClose={() => setBulkAnular(false)}
        title="Anular eventos"
        description="Se anularán"
        confirmLabel="Anular"
        confirmColor="red"
        count={selection.count}
        canConfirm={!!bulkMotivo.trim()}
        onConfirm={handleBulkAnular}
      >
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">Motivo *</label>
          <Input value={bulkMotivo} onChange={(e) => setBulkMotivo(e.target.value)} className="bg-card" placeholder="Motivo de anulación" />
        </div>
      </BulkActionModal>
    </div>
  );
}
