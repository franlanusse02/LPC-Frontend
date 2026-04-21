import { Fragment, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  FileX2,
  MoreHorizontal,
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
import { StatCard } from "@/modules/cierres/components/cierre-stat";
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

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </span>
      <span className="text-sm text-gray-700">{value}</span>
    </div>
  );
}

function EventoDetail({
  evento,
  comedorName,
}: {
  evento: EventoResponse;
  comedorName: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
      <DetailField label="Comedor" value={comedorName} />
      <DetailField label="Tipo de evento" value={evento.tipoEventoNombre} />
      <DetailField label="Solicitante" value={evento.solicitante} />
      <DetailField label="Cantidad personas" value={evento.cantidadPersonas} />
      <DetailField
        label="Precio unitario"
        value={
          evento.precioUnitario !== null
            ? fmtCurrency(evento.precioUnitario)
            : null
        }
      />
      <DetailField
        label="Monto total"
        value={
          evento.montoTotal !== null ? fmtCurrency(evento.montoTotal) : null
        }
      />
      <DetailField label="Centro de costo" value={evento.centroCosto} />
      <DetailField label="Edificio" value={evento.edificioNombre} />
      <DetailField label="Sala" value={evento.salaNombre} />
      <DetailField label="Funcionario" value={evento.funcionario} />
      <DetailField label="Oficina" value={evento.oficina} />
      <DetailField label="Responsable" value={evento.responsable} />
      <DetailField label="Empresa" value={evento.empresa} />
      <DetailField
        label="Dest. facturación"
        value={evento.destinatarioFactura}
      />
      <DetailField label="Área" value={evento.area} />
      <DetailField label="Email solicitante" value={evento.emailSolicitante} />
      <DetailField label="Lugar" value={evento.lugar} />
      <DetailField label="Medio de pago" value={evento.medioPago} />
      <DetailField label="Nro. operación" value={evento.numeroOperacion} />
      <DetailField label="Nro. orden / pedido" value={evento.numeroOrden} />
      <DetailField label="Concepto" value={evento.concepto} />
      <DetailField label="Tipo comprobante" value={evento.tipoComprobante} />
      <DetailField label="Nro. comprobante" value={evento.numeroComprobante} />
      <DetailField label="Observaciones" value={evento.observaciones} />
      <DetailField
        label="Retenciones"
        value={
          evento.retenciones !== null ? fmtCurrency(evento.retenciones!) : null
        }
      />
      {evento.facturaPdfNombreArchivo && (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Factura PDF
          </span>
          <span className="text-sm text-gray-700">
            {evento.facturaPdfNombreArchivo}
          </span>
        </div>
      )}
    </div>
  );
}

export default function EventosContabilidad() {
  const navigate = useNavigate();
  const { get, patch } = useApi();

  const [eventos, setEventos] = useState<EventoResponse[]>([]);
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);

  const [selectedEvento, setSelectedEvento] = useState<EventoResponse | null>(
    null,
  );
  const [anularOpen, setAnularOpen] = useState(false);
  const [realizarOpen, setRealizarOpen] = useState(false);
  const [emitirOpen, setEmitirOpen] = useState(false);
  const [cobrarOpen, setCobrarOpen] = useState(false);

  const [dateDesde, setDateDesde] = useState("");
  const [dateHasta, setDateHasta] = useState("");

  useEffect(() => {
    Promise.all([get("/eventos"), get("/comedores")]).then(
      ([eventosRes, comedoresRes]) => {
        eventosRes
          .json()
          .then((data) => setEventos(Array.isArray(data) ? data : []));
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
    if (dateDesde) list = list.filter((e) => e.fechaEvento >= dateDesde);
    if (dateHasta) list = list.filter((e) => e.fechaEvento <= dateHasta);
    return list;
  }, [eventos, dateDesde, dateHasta]);

  const { displayed, sort, expansion, filters } = useTableState(
    eventosAfterDateFilter,
    {
      searchFields: (e) => [
        comedorNameById[e.comedorId] ?? "",
        e.tipoEventoNombre ?? "",
        e.solicitante ?? "",
        e.fechaEvento,
        e.observaciones ?? "",
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
    },
  );

  const sortProps = {
    sortKey: sort.key,
    sortDir: sort.dir,
    onSort: sort.handleSort,
  };

  const totalActivos = eventos.filter((e) => e.anulacionId === null).length;
  const totalAnulados = eventos.filter((e) => e.anulacionId !== null).length;
  const montoTotal = eventos
    .filter((e) => e.anulacionId === null)
    .reduce((s, e) => s + (e.montoTotal ?? 0), 0);
  const montoFiltrado = displayed
    .filter((e) => e.anulacionId === null)
    .reduce((s, e) => s + (e.montoTotal ?? 0), 0);
  const isFiltered = displayed.length !== eventos.length;

  const handleAction = async (action: () => Promise<EventoResponse>) => {
    try {
      const updated = await action();
      setEventos((prev) =>
        prev.map((e) => (e.id === updated.id ? updated : e)),
      );
    } catch (err) {
      toast("Error", {
        description:
          err instanceof Error
            ? err.message
            : "No se pudo completar la operación",
      });
      throw err;
    }
  };

  const handleAnular = async (eventoId: number, motivo: string) => {
    await handleAction(async () => {
      const updated: EventoResponse = await patch(
        `/eventos/${eventoId}/anular`,
        { motivo },
      ).then((r) => r.json());
      toast("Evento anulado");
      return updated;
    });
  };

  const handleRealizar = async (eventoId: number) => {
    await handleAction(async () => {
      const updated: EventoResponse = await patch(
        `/eventos/${eventoId}/realizar`,
        {},
      ).then((r) => r.json());
      toast("Evento marcado como realizado");
      return updated;
    });
  };

  const handleEmitir = async (
    eventoId: number,
    payload: EmitirEventoPayload,
  ) => {
    await handleAction(async () => {
      const updated: EventoResponse = await patch(
        `/eventos/${eventoId}/emitir`,
        payload,
      ).then((r) => r.json());
      toast("Factura de evento emitida");
      return updated;
    });
  };

  const handleCobrar = async (
    eventoId: number,
    payload: CobrarEventoPayload,
  ) => {
    await handleAction(async () => {
      const updated: EventoResponse = await patch(
        `/eventos/${eventoId}/pagado`,
        payload,
      ).then((r) => r.json());
      toast("Cobro del evento registrado");
      return updated;
    });
  };

  const handleEliminarPdf = async (eventoId: number) => {
    await handleAction(async () => {
      const updated: EventoResponse = await patch(
        `/eventos/${eventoId}/eliminar-factura-pdf`,
        {},
      ).then((r) => r.json());
      toast("PDF eliminado");
      return updated;
    });
  };

  const openModal = (
    evento: EventoResponse,
    modal: "anular" | "realizar" | "emitir" | "cobrar",
  ) => {
    setSelectedEvento(evento);
    if (modal === "anular") setAnularOpen(true);
    if (modal === "realizar") setRealizarOpen(true);
    if (modal === "emitir") setEmitirOpen(true);
    if (modal === "cobrar") setCobrarOpen(true);
  };

  return (
    <div className="px-18 py-8">
      <div className="max-w-2/3 mx-auto">
        <Button variant="ghost" onClick={() => navigate("/contabilidad")}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>

      <div className="mx-auto max-w-2/3 grid grid-cols-2 gap-4 sm:grid-cols-5 pb-4">
        <StatCard label="Total eventos" value={eventos.length} />
        <StatCard label="Activos" value={totalActivos} accent="emerald" />
        <StatCard label="Anulados" value={totalAnulados} accent="red" />
        <StatCard label="Monto total" value={fmtCurrency(montoTotal)} />
        <StatCard
          label={isFiltered ? "Monto filtrado" : "Monto activo"}
          value={fmtCurrency(montoFiltrado)}
          accent={isFiltered ? "blue" : undefined}
        />
      </div>

      <Card className="mx-auto max-w-2/3 py-6 border-0 shadow-md rounded-xl">
        <CardHeader className="border-b px-6 py-4">
          <div className="flex flex-row justify-between">
            <CardTitle className="text-xl font-bold text-gray-800">
              Eventos
            </CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-3">
            <div className="flex items-center gap-1">
              <Input
                type="date"
                value={dateDesde}
                onChange={(e) => setDateDesde(e.target.value)}
                className="h-8 w-36 text-sm bg-gray-50 border-gray-200"
              />
              <span className="text-xs text-gray-400">—</span>
              <Input
                type="date"
                value={dateHasta}
                onChange={(e) => setDateHasta(e.target.value)}
                className="h-8 w-36 text-sm bg-gray-50 border-gray-200"
              />
            </div>
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
                <SortableTh
                  label="Monto"
                  col="montoTotal"
                  {...sortProps}
                  className="text-right"
                />
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
                  const comedorName =
                    comedorNameById[evento.comedorId] ??
                    String(evento.comedorId);

                  const canRealizar = evento.estado === "SOLICITADO";
                  const canEmitir =
                    evento.estado === "SOLICITADO" ||
                    evento.estado === "REALIZADO";
                  const canCobrar = evento.estado === "FACTURA_EMITIDA";
                  const hasPdf = !!evento.facturaPdfNombreArchivo;
                  const canEliminarPdf =
                    hasPdf &&
                    (evento.estado === "FACTURA_EMITIDA" ||
                      evento.estado === "COBRADO");

                  return (
                    <Fragment key={evento.id}>
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
                          onClick={() => expansion.toggleRow(evento.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </td>
                        <td
                          className="px-4 py-4 font-medium whitespace-nowrap cursor-pointer"
                          onClick={() => expansion.toggleRow(evento.id)}
                        >
                          {evento.fechaEvento}
                        </td>
                        <td
                          className="px-4 py-4 cursor-pointer"
                          onClick={() => expansion.toggleRow(evento.id)}
                        >
                          {comedorName}
                        </td>
                        <td
                          className="px-4 py-4 cursor-pointer"
                          onClick={() => expansion.toggleRow(evento.id)}
                        >
                          {evento.tipoEventoNombre ?? (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td
                          className="px-4 py-4 cursor-pointer"
                          onClick={() => expansion.toggleRow(evento.id)}
                        >
                          {evento.solicitante ?? (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td
                          className="px-4 py-4 text-right font-mono cursor-pointer"
                          onClick={() => expansion.toggleRow(evento.id)}
                        >
                          {evento.cantidadPersonas?.toLocaleString("es-AR") ?? (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td
                          className="px-4 py-4 text-right font-mono cursor-pointer"
                          onClick={() => expansion.toggleRow(evento.id)}
                        >
                          {evento.montoTotal !== null ? (
                            fmtCurrency(evento.montoTotal)
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td
                          className="px-4 py-4 text-center cursor-pointer"
                          onClick={() => expansion.toggleRow(evento.id)}
                        >
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                              estilos.bg,
                              estilos.text,
                            )}
                          >
                            {EstadoEventoLabel[evento.estado]}
                          </span>
                        </td>
                        <td
                          className="px-4 py-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {!isAnulado && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                                  aria-label="Acciones"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-48 rounded-xl shadow-lg border-gray-100"
                              >
                                {canRealizar && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      openModal(evento, "realizar")
                                    }
                                    className="gap-2.5 cursor-pointer rounded-lg"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />{" "}
                                    Realizar
                                  </DropdownMenuItem>
                                )}
                                {canEmitir && (
                                  <DropdownMenuItem
                                    onClick={() => openModal(evento, "emitir")}
                                    className="gap-2.5 cursor-pointer rounded-lg"
                                  >
                                    <Send className="h-4 w-4" /> Emitir factura
                                  </DropdownMenuItem>
                                )}
                                {canCobrar && (
                                  <DropdownMenuItem
                                    onClick={() => openModal(evento, "cobrar")}
                                    className="gap-2.5 cursor-pointer rounded-lg"
                                  >
                                    <CircleDollarSign className="h-4 w-4" />{" "}
                                    Cobrar
                                  </DropdownMenuItem>
                                )}
                                {canEliminarPdf && (
                                  <DropdownMenuItem
                                    onClick={() => handleEliminarPdf(evento.id)}
                                    className="gap-2.5 cursor-pointer rounded-lg"
                                  >
                                    <FileX2 className="h-4 w-4" /> Eliminar PDF
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => openModal(evento, "anular")}
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
                          <td colSpan={9} className="px-8 py-5">
                            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                              <EventoDetail
                                evento={evento}
                                comedorName={comedorName}
                              />
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

      <AnularEventoModal
        open={anularOpen}
        onClose={() => setAnularOpen(false)}
        evento={selectedEvento}
        onConfirm={handleAnular}
      />
      <RealizarEventoModal
        open={realizarOpen}
        onClose={() => setRealizarOpen(false)}
        evento={selectedEvento}
        onConfirm={handleRealizar}
      />
      <EmitirEventoModal
        open={emitirOpen}
        onClose={() => setEmitirOpen(false)}
        evento={selectedEvento}
        onConfirm={handleEmitir}
      />
      <CobrarEventoModal
        open={cobrarOpen}
        onClose={() => setCobrarOpen(false)}
        evento={selectedEvento}
        onConfirm={handleCobrar}
      />
    </div>
  );
}
