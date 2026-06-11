import { Fragment, useEffect, useMemo, useState } from "react";
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
  MoreHorizontal,
  Pencil,
  Send,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DataTable, SortableTh } from "@/components/data-table";
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
import { useTableState } from "@/hooks/useTableState";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionModal } from "@/components/BulkActionModal";
import { handleBulkResponse } from "@/lib/bulk-utils";
import { StatCard } from "@/modules/cierres/components/cierre-stat";
import type { BulkActionResponse } from "@/domain/dto/shared/BulkActionResponse";
import type { EventoResponse } from "@/domain/dto/evento/EventoResponse";
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

  const [eventos, setEventos] = useState<EventoResponse[]>([]);
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("TODOS");

  const [selectedEvento, setSelectedEvento] = useState<EventoResponse | null>(null);
  const [anularOpen, setAnularOpen] = useState(false);
  const [realizarOpen, setRealizarOpen] = useState(false);
  const [emitirOpen, setEmitirOpen] = useState(false);
  const [cobrarOpen, setCobrarOpen] = useState(false);

  const [listFilters, setListFilters] = useState<ListFilterState>({ ...defaultFilters, dateField: "fechaEvento" });

  useEffect(() => {
    Promise.all([get("/eventos"), get("/comedores")]).then(
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

  const eventosAfterDateFilter = useMemo(() => {
    let list = [...eventos];
    const getDate = listFilters.dateField === "creadoEn"
      ? (e: EventoResponse) =>
          new Date(e.creadoEn).toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" })
      : (e: EventoResponse) => e.fechaEvento;
    if (listFilters.desde) list = list.filter((e) => getDate(e) >= listFilters.desde);
    if (listFilters.hasta) list = list.filter((e) => getDate(e) <= listFilters.hasta);
    if (listFilters.comedorId) list = list.filter((e) => e.comedorId === Number(listFilters.comedorId));
    return list;
  }, [eventos, listFilters]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { TODOS: eventosAfterDateFilter.length };
    for (const e of eventosAfterDateFilter) {
      counts[e.tipoComedor] = (counts[e.tipoComedor] || 0) + 1;
    }
    return counts;
  }, [eventosAfterDateFilter]);

  const availableTabs = useMemo(
    () => TAB_ORDER.filter((k) => k === "TODOS" || (tabCounts[k] ?? 0) > 0),
    [tabCounts],
  );

  const eventosForTab = useMemo(() => {
    if (activeTab === "TODOS") return eventosAfterDateFilter;
    return eventosAfterDateFilter.filter((e) => e.tipoComedor === activeTab);
  }, [eventosAfterDateFilter, activeTab]);

  const hasExtraCols = activeTab !== "TODOS" && activeTab !== "DEFAULT";

  const { displayed, sort, expansion, filters } = useTableState(eventosForTab, {
    searchFields: (e) => [
      comedorNameById[e.comedorId] ?? "",
      e.fechaEvento,
      e.observaciones ?? "",
      String(ev(e, "solicitanteNombre") ?? ""),
      String(ev(e, "funcionarioNombre") ?? ""),
      String(ev(e, "razonSocial") ?? ""),
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

  const totalActivos = eventosForTab.filter((e) => e.anulacionId === null).length;
  const totalAnulados = eventosForTab.filter((e) => e.anulacionId !== null).length;
  const montoTotal = eventosForTab
    .filter((e) => e.anulacionId === null)
    .reduce((s, e) => s + (e.montoTotal ?? 0), 0);
  const montoFiltrado = displayed
    .filter((e) => e.anulacionId === null)
    .reduce((s, e) => s + (e.montoTotal ?? 0), 0);
  const isFiltered = displayed.length !== eventosForTab.length;

  const handleAction = async (action: () => Promise<EventoResponse>) => {
    try {
      const updated = await action();
      setEventos((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
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

  const selection = useRowSelection();

  const [bulkRealizar, setBulkRealizar] = useState(false);
  const [bulkEmitir, setBulkEmitir] = useState(false);
  const [bulkCobrar, setBulkCobrar] = useState(false);
  const [bulkAnular, setBulkAnular] = useState(false);
  const [bulkMotivo, setBulkMotivo] = useState("");
  const [bulkFechaPago, setBulkFechaPago] = useState("");
  const [bulkMedioPago, setBulkMedioPago] = useState("");
  const [bulkNumeroOp, setBulkNumeroOp] = useState("");

  const selectedEventos = displayed.filter((e) => selection.selected.has(e.id));
  const allSolicitado = selectedEventos.length > 0 && selectedEventos.every((e) => e.estado === "SOLICITADO");
  const allEmitible = selectedEventos.length > 0 && selectedEventos.every((e) => e.estado === "SOLICITADO" || e.estado === "REALIZADO");
  const allFacturaEmitida = selectedEventos.length > 0 && selectedEventos.every((e) => e.estado === "FACTURA_EMITIDA");
  const allAnulable = selectedEventos.length > 0 && selectedEventos.every((e) => e.estado === "SOLICITADO" || e.estado === "REALIZADO" || e.estado === "FACTURA_EMITIDA");

  const selectableIds = displayed
    .filter((e) => e.estado !== "ANULADO" && e.estado !== "COBRADO")
    .map((e) => e.id);

  const refetchEventos = () => {
    get("/eventos")
      .then((r) => r.json())
      .then((data) => setEventos(Array.isArray(data) ? data : []));
  };

  const handleBulkRealizar = async () => {
    const res = await post("/eventos/bulk/realizar", { ids: [...selection.selected] })
      .then((r) => r.json() as Promise<BulkActionResponse>);
    handleBulkResponse(res, "Realización");
    selection.clear();
    refetchEventos();
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
    refetchEventos();
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
    refetchEventos();
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
    refetchEventos();
    setBulkMotivo("");
  };

  const exportColumns = useMemo(
    () => buildExportColumns(activeTab, comedorNameById),
    [activeTab, comedorNameById],
  );

  const handleExport = () => {
    const data = selection.count > 0
      ? displayed.filter((e) => selection.selected.has(e.id))
      : displayed;
    const segments = ["eventos"];
    if (activeTab !== "TODOS") segments.push(activeTab.toLowerCase());
    if (filters.status !== "all") segments.push(filters.status.toLowerCase());
    if (listFilters.desde) segments.push(`desde-${listFilters.desde}`);
    if (listFilters.hasta) segments.push(`hasta-${listFilters.hasta}`);
    exportToXlsx({ data, columns: exportColumns, filename: segments.join("-") });
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
        <StatCard label="Total eventos" value={eventosForTab.length} />
        <StatCard label="Activos" value={totalActivos} accent="emerald" />
        <StatCard label="Anulados" value={totalAnulados} accent="red" />
        <StatCard label="Monto total" value={fmtCurrency(montoTotal)} />
        <StatCard
          label={isFiltered ? "Monto filtrado" : "Monto activo"}
          value={fmtCurrency(montoFiltrado)}
          accent={isFiltered ? "blue" : undefined}
        />
      </div>

      <Card className="mx-auto max-w-7xl py-6 border-0 shadow-md rounded-xl">
        <CardHeader className="border-b px-6 py-4">
          <div className="flex flex-row justify-between">
            <CardTitle className="text-xl font-bold text-gray-800">Eventos</CardTitle>
          </div>
          <div className="pt-3">
            <ListFilters
              filters={listFilters}
              onChange={setListFilters}
              comedores={comedores}
              showSociedad={false}
              dateFieldOptions={[
                { value: "fechaEvento", label: "Fecha Evento" },
                { value: "creadoEn", label: "Fecha de Carga" },
              ]}
            />
          </div>
          <div className="flex gap-1 pt-3 border-t mt-3 overflow-x-auto">
            {availableTabs.map((tab) => (
              <button
                type="button"
                key={tab}
                onClick={() => { setActiveTab(tab); selection.clear(); }}
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
            displayedCount={displayed.length}
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
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="size-4 mr-1.5" />
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
            toolbarRight={
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="size-4 mr-1.5" />
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
                {displayed.map((evento) => {
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
