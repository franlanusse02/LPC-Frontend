
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/models/dto/ApiError";
import { DetailedCierreCajaResponse } from "@/models/dto/cierre-caja/CierreCajaResponse";
import { FacturaProveedorResponse } from "@/models/dto/compra/FacturaProveedorResponse";
import { ProveedorResponse } from "@/models/dto/proveedor/ProveedorResponse";
import { ComedorResponse } from "@/models/dto/comedor/ComedorResponse";
import { PuntoDeVentaResponse } from "@/models/dto/pto-venta/PuntoDeVentaResponse";
import { SociedadResponse } from "@/models/dto/sociedad/SociedadResponse";
import { CreateFacturaProveedorRequest } from "@/models/dto/compra/CreateFacturaProveedorRequest";
import { PatchFacturaProveedorRequest } from "@/models/dto/compra/PatchFacturaProveedorRequest";
import { AnularCierreModal } from "@/components/anular-cierre-modal";
import { EditarCierreModal } from "@/components/editar-cierre-modal";
import { CierresTable } from "@/components/cierres-table";
import { FacturaSortDir, FacturaSortKey, FacturaStatusFilter, FacturasTable } from "@/components/facturas-table";
import { NuevaFacturaModal } from "@/components/nueva-factura-modal";
import { EmitirFacturaModal } from "@/components/emitir-factura-modal";
import { PagarFacturaModal } from "@/components/pagar-factura-modal";
import { EditarFacturaModal } from "@/components/editar-factura-modal";
import { AnularFacturaModal } from "@/components/anular-factura-modal";
import { EstadoFacturaLabel } from "@/models/enums/EstadoFactura";
import { buildExportFilename, exportRowsToXlsx, formatIsoDateForFilename } from "@/lib/export-xlsx";
import { ChevronDown, ChevronUp, Download, FileSpreadsheet, LibraryBig, Search, SlidersHorizontal, X } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { DatePickerInput } from "@/components/date-picker-input";
import { EventoResponse } from "@/models/dto/evento/EventoResponse";
import { EstadoEventoLabel } from "@/models/enums/EstadoEvento";
import { EventoSortDir, EventoSortKey, EventoStatusFilter, EventosTable } from "@/components/eventos-table";
import { ConsumosTable, ConsumoSortDir, ConsumoSortKey, ConsumoStatusFilter } from "@/components/consumos-table";
import { AnularEventoModal } from "@/components/anular-evento-modal";
import { RealizarEventoModal } from "@/components/realizar-evento-modal";
import { EmitirEventoModal, EmitirEventoPayload } from "@/components/emitir-evento-modal";
import { PagarEventoModal, PagarEventoPayload } from "@/components/pagar-evento-modal";
import { EliminarPdfEventoModal } from "@/components/eliminar-pdf-evento-modal";
import { EditarConsumoModal } from "@/components/editar-consumo-modal";
import { AnularConsumoModal } from "@/components/anular-consumo-modal";
import { ConsumoResponse } from "@/models/dto/consumos/ConsumoResponse";
import { ConsumidorResponse } from "@/models/dto/consumos/ConsumidorResponse";
import { ProductoResponse } from "@/models/dto/consumos/ProductoResponse";
import { PatchConsumoRequest } from "@/models/dto/consumos/PatchConsumoRequest";
import { buildConsumoListItem, ConsumoListItem, enrichConsumos } from "@/lib/consumos";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { facturaTienePuntoDeVentaComedor } from "@/lib/facturas";

type View = "cierres" | "compras" | "eventos" | "consumos";
type ConsumoViewMode = "grouped" | "detailed";
type PageResponse<T> = { content: T[] };
type GroupedConsumoItem = {
  key: string;
  fecha: string;
  comedorNombre: string;
  cantidadConsumos: number;
  cantidadConsumidores: number;
  puntosDeVenta: string[];
  total: number;
  activos: number;
  anulados: number;
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(n);

const buildDateRangePart = (dateDesde: string, dateHasta: string) => {
  if (dateDesde && dateHasta) {
    return `from_${formatIsoDateForFilename(dateDesde)}_to_${formatIsoDateForFilename(dateHasta)}`;
  }
  if (dateDesde) return `from_${formatIsoDateForFilename(dateDesde)}`;
  if (dateHasta) return `to_${formatIsoDateForFilename(dateHasta)}`;
  return null;
};

const buildSearchPart = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? `search_${trimmed.slice(0, 32)}` : null;
};

const consumoStatusExportLabel = (value: ConsumoStatusFilter) => {
  if (value === "active") return "activos";
  if (value === "anulado") return "anulados";
  return "todos";
};

const consumoStatusLabel: Record<ConsumoStatusFilter, string> = {
  all: "Todos",
  active: "Activos",
  anulado: "Anulados",
};

const formatSummaryNames = (items: string[], limit = 2) => {
  if (items.length <= limit) return items.join(", ");
  return `${items.slice(0, limit).join(", ")} +${items.length - limit}`;
};

const formatFacturaDistribucion = (
  distribucion: Record<string, number>,
  puntoDeVentaNameById: Record<number, string>,
) =>
  Object.entries(distribucion ?? {})
    .sort(([leftId], [rightId]) => Number(leftId) - Number(rightId))
    .map(([puntoDeVentaId, porcentaje]) =>
      `${puntoDeVentaNameById[Number(puntoDeVentaId)] ?? `Punto ${puntoDeVentaId}`} ${porcentaje}%`,
    )
    .join(", ");

export default function ContabilidadPage() {
  const router = useRouter();
  const { session, isLoading } = useAuth();
  const { toast } = useToast();

  const [view, setView] = useState<View>("cierres");
  const [ingresosExpanded, setIngresosExpanded] = useState(false);
  const [egresosExpanded, setEgresosExpanded] = useState(false);

  // shared filters
  const [dateDesde, setDateDesde] = useState("");
  const [dateHasta, setDateHasta] = useState("");
  const [comedorFilter, setComedorFilter] = useState("");
  const [sociedadFilter, setSociedadFilter] = useState("");
  const [puntoDeVentaFilter, setPuntoDeVentaFilter] = useState("");

  // cierres
  const [cierres, setCierres] = useState<DetailedCierreCajaResponse[]>([]);
  const [loadingCierres, setLoadingCierres] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "anulado">("active");
  const [sortKey, setSortKey] = useState<"fechaOperacion" | "comedor" | "creadoPor" | "puntoDeVenta" | "totalPlatosVendidos" | "montoTotal">("fechaOperacion");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [anularCierreModal, setAnularCierreModal] = useState<{
    open: boolean; cierreId: number; fechaOperacion: string; puntoVenta: string;
  } | null>(null);
  const [editarCierreModal, setEditarCierreModal] = useState<DetailedCierreCajaResponse | null>(null);
  const [puntosDeVenta, setPuntosDeVenta] = useState<PuntoDeVentaResponse[]>([]);

  // compras
  const [facturas, setFacturas] = useState<FacturaProveedorResponse[]>([]);
  const [loadingFacturas, setLoadingFacturas] = useState(true);
  const [proveedores, setProveedores] = useState<ProveedorResponse[]>([]);
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [sociedades, setSociedades] = useState<SociedadResponse[]>([]);
  const [nuevaFacturaOpen, setNuevaFacturaOpen] = useState(false);
  const [emitirFactura, setEmitirFactura] = useState<FacturaProveedorResponse | null>(null);
  const [pagarFactura, setPagarFactura] = useState<FacturaProveedorResponse | null>(null);
  const [editarFactura, setEditarFactura] = useState<FacturaProveedorResponse | null>(null);
  const [anularFactura, setAnularFactura] = useState<FacturaProveedorResponse | null>(null);
  const [facturaSearch, setFacturaSearch] = useState("");
  const [facturaStatusFilter, setFacturaStatusFilter] = useState<FacturaStatusFilter>("all");
  const [facturaSortKey, setFacturaSortKey] = useState<FacturaSortKey>("fechaFactura");
  const [facturaSortDir, setFacturaSortDir] = useState<FacturaSortDir>("desc");

  // eventos
  const [eventos, setEventos] = useState<EventoResponse[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(true);
  const [eventoSearch, setEventoSearch] = useState("");
  const [eventoStatusFilter, setEventoStatusFilter] = useState<EventoStatusFilter>("all");
  const [eventoSortKey, setEventoSortKey] = useState<EventoSortKey>("fechaEvento");
  const [eventoSortDir, setEventoSortDir] = useState<EventoSortDir>("desc");
  const [realizarEvento, setRealizarEvento] = useState<EventoResponse | null>(null);
  const [emitirEvento, setEmitirEvento] = useState<EventoResponse | null>(null);
  const [pagarEvento, setPagarEvento] = useState<EventoResponse | null>(null);
  const [eliminarPdfEvento, setEliminarPdfEvento] = useState<EventoResponse | null>(null);
  const [anularEvento, setAnularEvento] = useState<EventoResponse | null>(null);

  // consumos
  const [consumos, setConsumos] = useState<ConsumoListItem[]>([]);
  const [loadingConsumos, setLoadingConsumos] = useState(true);
  const [consumidores, setConsumidores] = useState<ConsumidorResponse[]>([]);
  const [productosConsumo, setProductosConsumo] = useState<ProductoResponse[]>([]);
  const [consumoSearch, setConsumoSearch] = useState("");
  const [consumoStatusFilter, setConsumoStatusFilter] =
    useState<ConsumoStatusFilter>("active");
  const [consumoSortKey, setConsumoSortKey] =
    useState<ConsumoSortKey>("fecha");
  const [consumoSortDir, setConsumoSortDir] =
    useState<ConsumoSortDir>("desc");
  const [consumoViewMode, setConsumoViewMode] =
    useState<ConsumoViewMode>("grouped");
  const [editarConsumo, setEditarConsumo] = useState<ConsumoListItem | null>(null);
  const [anularConsumo, setAnularConsumo] = useState<ConsumoListItem | null>(null);

  // sociedad → comedor filtering helpers
  const comedoresDeSociedad = useMemo(() => {
    if (!sociedadFilter) return comedores;
    return comedores.filter((c) => c.sociedadId === Number(sociedadFilter));
  }, [comedores, sociedadFilter]);

  const comedorIdsDeSociedad = useMemo(
    () => new Set(comedoresDeSociedad.map((c) => c.id)),
    [comedoresDeSociedad],
  );

  const comedorNamesDeSociedad = useMemo(
    () => new Set(comedoresDeSociedad.map((c) => c.nombre)),
    [comedoresDeSociedad],
  );

  const comedorIdFilter = useMemo(
    () => comedores.find((c) => c.nombre === comedorFilter)?.id ?? null,
    [comedores, comedorFilter],
  );

  const proveedorNameById = useMemo(
    () => Object.fromEntries(proveedores.map((proveedor) => [proveedor.id, proveedor.nombre])),
    [proveedores],
  );

  const comedorNameById = useMemo(
    () => Object.fromEntries(comedores.map((comedor) => [comedor.id, comedor.nombre])),
    [comedores],
  );

  const puntoDeVentaNameById = useMemo(
    () => Object.fromEntries(puntosDeVenta.map((puntoDeVenta) => [puntoDeVenta.id, puntoDeVenta.nombre])),
    [puntosDeVenta],
  );

  const puntoDeVentaOptions = useMemo(() => {
    let list = [...puntosDeVenta];
    if (comedorIdFilter !== null) list = list.filter((puntoDeVenta) => puntoDeVenta.comedorId === comedorIdFilter);
    else if (sociedadFilter) list = list.filter((puntoDeVenta) => comedorIdsDeSociedad.has(puntoDeVenta.comedorId));
    return list.sort((left, right) => left.nombre.localeCompare(right.nombre));
  }, [puntosDeVenta, comedorIdFilter, sociedadFilter, comedorIdsDeSociedad]);

  const selectedPuntoDeVenta = useMemo(
    () => puntosDeVenta.find((puntoDeVenta) => String(puntoDeVenta.id) === puntoDeVentaFilter) ?? null,
    [puntosDeVenta, puntoDeVentaFilter],
  );

  useEffect(() => {
    if (puntoDeVentaFilter && !puntoDeVentaOptions.some((puntoDeVenta) => String(puntoDeVenta.id) === puntoDeVentaFilter)) {
      setPuntoDeVentaFilter("");
    }
  }, [puntoDeVentaFilter, puntoDeVentaOptions]);

  const comedorOptions = useMemo(
    () => [...new Set([
      ...cierres
        .filter((c) => !sociedadFilter || comedorNamesDeSociedad.has(c.comedor.nombre))
        .map((c) => c.comedor.nombre),
      ...comedoresDeSociedad.map((c) => c.nombre),
    ])].sort(),
    [cierres, comedoresDeSociedad, comedorNamesDeSociedad, sociedadFilter],
  );

  const sociedadOptions = useMemo(
    () => [...sociedades].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [sociedades],
  );

  const displayedCierres = useMemo(() => {
    let list = [...cierres];
    if (statusFilter === "active") list = list.filter((c) => c.anulacionId === null);
    if (statusFilter === "anulado") list = list.filter((c) => c.anulacionId !== null);
    if (comedorFilter) list = list.filter((c) => c.comedor.nombre === comedorFilter);
    else if (sociedadFilter) list = list.filter((c) => comedorNamesDeSociedad.has(c.comedor.nombre));
    if (puntoDeVentaFilter) list = list.filter((c) => String(c.puntoDeVenta.id) === puntoDeVentaFilter);
    if (dateDesde) list = list.filter((c) => c.fechaOperacion >= dateDesde);
    if (dateHasta) list = list.filter((c) => c.fechaOperacion <= dateHasta);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((c) =>
        c.comedor.nombre.toLowerCase().includes(q) ||
        c.puntoDeVenta.nombre.toLowerCase().includes(q) ||
        c.creadoPor.nombre.toLowerCase().includes(q) ||
        c.fechaOperacion.toLowerCase().includes(q) ||
        (c.comentarios ?? "").toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      if (sortKey === "fechaOperacion") { av = a.fechaOperacion; bv = b.fechaOperacion; }
      if (sortKey === "comedor") { av = a.comedor.nombre; bv = b.comedor.nombre; }
      if (sortKey === "creadoPor") { av = a.creadoPor.nombre; bv = b.creadoPor.nombre; }
      if (sortKey === "puntoDeVenta") { av = a.puntoDeVenta.nombre; bv = b.puntoDeVenta.nombre; }
      if (sortKey === "totalPlatosVendidos") { av = a.totalPlatosVendidos; bv = b.totalPlatosVendidos; }
      if (sortKey === "montoTotal") { av = a.montoTotal; bv = b.montoTotal; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [cierres, statusFilter, comedorFilter, sociedadFilter, comedorNamesDeSociedad, puntoDeVentaFilter, dateDesde, dateHasta, search, sortKey, sortDir]);

  const montoVentas = useMemo(() => {
    let list = cierres.filter((c) => c.anulacionId === null);
    if (dateDesde) list = list.filter((c) => c.fechaOperacion >= dateDesde);
    if (dateHasta) list = list.filter((c) => c.fechaOperacion <= dateHasta);
    if (comedorFilter) list = list.filter((c) => c.comedor.nombre === comedorFilter);
    else if (sociedadFilter) list = list.filter((c) => comedorNamesDeSociedad.has(c.comedor.nombre));
    if (puntoDeVentaFilter) list = list.filter((c) => String(c.puntoDeVenta.id) === puntoDeVentaFilter);
    return list.reduce((s, c) => s + c.montoTotal, 0);
  }, [cierres, dateDesde, dateHasta, comedorFilter, sociedadFilter, comedorNamesDeSociedad, puntoDeVentaFilter]);

  const montoCompras = useMemo(() => {
    let list = facturas.filter((f) => f.estado !== "ANULADA");
    if (dateDesde) list = list.filter((f) => f.fechaFactura >= dateDesde);
    if (dateHasta) list = list.filter((f) => f.fechaFactura <= dateHasta);
    if (comedorIdFilter !== null) list = list.filter((f) => f.comedorId === comedorIdFilter);
    else if (sociedadFilter) list = list.filter((f) => comedorIdsDeSociedad.has(f.comedorId));
    if (puntoDeVentaFilter) {
      list = list.filter((f) => facturaTienePuntoDeVentaComedor(f.puntoDeVentaComedor, puntoDeVentaFilter));
    }
    return list.reduce((s, f) => s + f.monto, 0);
  }, [facturas, dateDesde, dateHasta, comedorIdFilter, sociedadFilter, comedorIdsDeSociedad, puntoDeVentaFilter]);

  const montoEventos = useMemo(() => {
    let list = eventos.filter((e) => e.estado !== "ANULADO");
    if (dateDesde) list = list.filter((e) => e.fechaEvento >= dateDesde);
    if (dateHasta) list = list.filter((e) => e.fechaEvento <= dateHasta);
    if (comedorIdFilter !== null) list = list.filter((e) => e.comedorId === comedorIdFilter);
    else if (sociedadFilter) list = list.filter((e) => comedorIdsDeSociedad.has(e.comedorId));
    return list.reduce((s, e) => s + (e.montoTotal ?? 0), 0);
  }, [eventos, dateDesde, dateHasta, comedorIdFilter, sociedadFilter, comedorIdsDeSociedad]);

  const displayedEventos = useMemo(() => {
    let list = [...eventos];
    if (dateDesde) list = list.filter((e) => e.fechaEvento >= dateDesde);
    if (dateHasta) list = list.filter((e) => e.fechaEvento <= dateHasta);
    if (comedorIdFilter !== null) list = list.filter((e) => e.comedorId === comedorIdFilter);
    else if (sociedadFilter) list = list.filter((e) => comedorIdsDeSociedad.has(e.comedorId));
    if (eventoStatusFilter !== "all") list = list.filter((e) => e.estado === eventoStatusFilter);
    if (eventoSearch.trim()) {
      const q = eventoSearch.trim().toLowerCase();
      list = list.filter((e) =>
        (comedorNameById[e.comedorId] ?? "").toLowerCase().includes(q) ||
        (e.solicitanteNombre ?? "").toLowerCase().includes(q) ||
        (e.tipoEventoNombre ?? "").toLowerCase().includes(q) ||
        e.fechaEvento.includes(q),
      );
    }
    list.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      if (eventoSortKey === "fechaEvento") { av = a.fechaEvento; bv = b.fechaEvento; }
      if (eventoSortKey === "comedor") { av = comedorNameById[a.comedorId] ?? ""; bv = comedorNameById[b.comedorId] ?? ""; }
      if (eventoSortKey === "montoTotal") { av = a.montoTotal ?? 0; bv = b.montoTotal ?? 0; }
      if (eventoSortKey === "estado") { av = a.estado; bv = b.estado; }
      if (av < bv) return eventoSortDir === "asc" ? -1 : 1;
      if (av > bv) return eventoSortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [eventos, dateDesde, dateHasta, comedorIdFilter, sociedadFilter, comedorIdsDeSociedad, eventoStatusFilter, eventoSearch, eventoSortKey, eventoSortDir, comedorNameById]);

  const displayedConsumos = useMemo(() => {
    let list = [...consumos];
    if (dateDesde) list = list.filter((item) => item.fecha >= dateDesde);
    if (dateHasta) list = list.filter((item) => item.fecha <= dateHasta);
    if (comedorIdFilter !== null) list = list.filter((item) => item.comedorId === comedorIdFilter);
    else if (sociedadFilter) list = list.filter((item) => item.comedorId !== null && comedorIdsDeSociedad.has(item.comedorId));
    if (puntoDeVentaFilter) list = list.filter((item) => String(item.PuntoDeVentaId) === puntoDeVentaFilter);
    if (consumoStatusFilter === "active") list = list.filter((item) => !item.anulado);
    if (consumoStatusFilter === "anulado") list = list.filter((item) => item.anulado);
    if (consumoSearch.trim()) {
      const query = consumoSearch.trim().toLowerCase();
      list = list.filter((item) =>
        item.comedorNombre.toLowerCase().includes(query) ||
        item.puntoDeVentaNombre.toLowerCase().includes(query) ||
        item.consumidorNombre.toLowerCase().includes(query) ||
        item.fecha.includes(query) ||
        (item.observaciones ?? "").toLowerCase().includes(query),
      );
    }
    list.sort((left, right) => {
      let leftValue: string | number = "";
      let rightValue: string | number = "";
      if (consumoSortKey === "fecha") { leftValue = left.fecha; rightValue = right.fecha; }
      if (consumoSortKey === "comedor") { leftValue = left.comedorNombre; rightValue = right.comedorNombre; }
      if (consumoSortKey === "puntoDeVenta") { leftValue = left.puntoDeVentaNombre; rightValue = right.puntoDeVentaNombre; }
      if (consumoSortKey === "consumidor") { leftValue = left.consumidorNombre; rightValue = right.consumidorNombre; }
      if (consumoSortKey === "total") { leftValue = left.total; rightValue = right.total; }
      if (leftValue < rightValue) return consumoSortDir === "asc" ? -1 : 1;
      if (leftValue > rightValue) return consumoSortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [
    comedorIdFilter,
    comedorIdsDeSociedad,
    consumoSearch,
    consumoSortDir,
    consumoSortKey,
    consumoStatusFilter,
    consumos,
    dateDesde,
    dateHasta,
    puntoDeVentaFilter,
    sociedadFilter,
  ]);

  const montoConsumos = useMemo(() => {
    let list = consumos.filter((item) => !item.anulado);
    if (dateDesde) list = list.filter((item) => item.fecha >= dateDesde);
    if (dateHasta) list = list.filter((item) => item.fecha <= dateHasta);
    if (comedorIdFilter !== null) list = list.filter((item) => item.comedorId === comedorIdFilter);
    else if (sociedadFilter) list = list.filter((item) => item.comedorId !== null && comedorIdsDeSociedad.has(item.comedorId));
    if (puntoDeVentaFilter) list = list.filter((item) => String(item.PuntoDeVentaId) === puntoDeVentaFilter);
    return list.reduce((sum, item) => sum + item.total, 0);
  }, [comedores, comedorIdFilter, comedorIdsDeSociedad, consumos, dateDesde, dateHasta, puntoDeVentaFilter, sociedadFilter]);

  const montoIngresos = montoVentas + montoEventos + montoConsumos;
  const montoEgresos = montoCompras;
  const totalGeneral = montoIngresos - montoEgresos;

  const groupedConsumos = useMemo<GroupedConsumoItem[]>(() => {
    const groups = new Map<string, {
      fecha: string;
      comedorNombre: string;
      cantidadConsumos: number;
      total: number;
      activos: number;
      anulados: number;
      consumidores: Set<string>;
      puntosDeVenta: Set<string>;
    }>();

    displayedConsumos.forEach((item) => {
      const key = `${item.fecha}::${item.comedorId ?? item.comedorNombre}`;
      const current = groups.get(key) ?? {
        fecha: item.fecha,
        comedorNombre: item.comedorNombre,
        cantidadConsumos: 0,
        total: 0,
        activos: 0,
        anulados: 0,
        consumidores: new Set<string>(),
        puntosDeVenta: new Set<string>(),
      };

      current.cantidadConsumos += 1;
      current.total += item.total;
      current.consumidores.add(item.consumidorNombre);
      current.puntosDeVenta.add(item.puntoDeVentaNombre);

      if (item.anulado) current.anulados += 1;
      else current.activos += 1;

      groups.set(key, current);
    });

    return Array.from(groups.entries())
      .map(([key, value]) => ({
        key,
        fecha: value.fecha,
        comedorNombre: value.comedorNombre,
        cantidadConsumos: value.cantidadConsumos,
        cantidadConsumidores: value.consumidores.size,
        puntosDeVenta: Array.from(value.puntosDeVenta).sort(),
        total: value.total,
        activos: value.activos,
        anulados: value.anulados,
      }))
      .sort((left, right) => {
        if (left.fecha !== right.fecha) {
          return left.fecha < right.fecha ? 1 : -1;
        }
        return left.comedorNombre.localeCompare(right.comedorNombre);
      });
  }, [displayedConsumos]);

  const consumoHasActiveFilters = Boolean(
    dateDesde ||
    dateHasta ||
    comedorFilter ||
    sociedadFilter ||
    puntoDeVentaFilter ||
    consumoSearch.trim() ||
    consumoStatusFilter !== "active",
  );

  const displayedFacturas = useMemo(() => {
    let list = [...facturas];
    if (dateDesde) list = list.filter((factura) => factura.fechaFactura >= dateDesde);
    if (dateHasta) list = list.filter((factura) => factura.fechaFactura <= dateHasta);
    if (comedorIdFilter !== null) list = list.filter((factura) => factura.comedorId === comedorIdFilter);
    else if (sociedadFilter) list = list.filter((factura) => comedorIdsDeSociedad.has(factura.comedorId));
    if (puntoDeVentaFilter) {
      list = list.filter((factura) =>
        facturaTienePuntoDeVentaComedor(factura.puntoDeVentaComedor, puntoDeVentaFilter),
      );
    }
    if (facturaStatusFilter !== "all") list = list.filter((factura) => factura.estado === facturaStatusFilter);
    if (facturaSearch.trim()) {
      const query = facturaSearch.trim().toLowerCase();
      list = list.filter((factura) =>
        factura.numero.toLowerCase().includes(query) ||
        (proveedorNameById[factura.proveedorId] ?? "").toLowerCase().includes(query),
      );
    }
    list.sort((left, right) => {
      let leftValue: string | number = "";
      let rightValue: string | number = "";
      if (facturaSortKey === "fechaFactura") { leftValue = left.fechaFactura; rightValue = right.fechaFactura; }
      if (facturaSortKey === "monto") { leftValue = left.monto; rightValue = right.monto; }
      if (facturaSortKey === "proveedor") {
        leftValue = proveedorNameById[left.proveedorId] ?? "";
        rightValue = proveedorNameById[right.proveedorId] ?? "";
      }
      if (facturaSortKey === "estado") { leftValue = left.estado; rightValue = right.estado; }
      if (leftValue < rightValue) return facturaSortDir === "asc" ? -1 : 1;
      if (leftValue > rightValue) return facturaSortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [
    comedorIdFilter,
    dateDesde,
    dateHasta,
    facturaSearch,
    facturaSortDir,
    facturaSortKey,
    facturaStatusFilter,
    facturas,
    puntoDeVentaFilter,
    proveedorNameById,
    sociedadFilter,
    comedorIdsDeSociedad,
  ]);

  const clearFilters = () => {
    setDateDesde(""); setDateHasta(""); setComedorFilter(""); setSociedadFilter(""); setPuntoDeVentaFilter("");
    setSearch(""); setStatusFilter("active");
    setFacturaSearch(""); setFacturaStatusFilter("all");
    setEventoSearch(""); setEventoStatusFilter("all");
    setConsumoSearch(""); setConsumoStatusFilter("active");
  };

  const handleExportCurrentView = () => {
    if (view === "cierres") {
      exportRowsToXlsx(
        displayedCierres.map((cierre) => ({
          Fecha: cierre.fechaOperacion,
          Comedor: cierre.comedor.nombre,
          "Creado por": cierre.creadoPor.nombre,
          "Punto de venta": cierre.puntoDeVenta.nombre,
          Platos: cierre.totalPlatosVendidos,
          "Monto total": cierre.montoTotal,
          Estado: cierre.anulacionId === null ? "Activo" : "Anulado",
          Comentarios: cierre.comentarios ?? "",
        })),
        "Cierres",
        buildExportFilename("cierres", [
          comedorFilter,
          selectedPuntoDeVenta?.nombre,
          buildDateRangePart(dateDesde, dateHasta),
          statusFilter !== "active" ? (statusFilter === "all" ? "todos" : "anulados") : null,
          buildSearchPart(search),
        ]),
      );
      return;
    }

    if (view === "compras") {
      exportRowsToXlsx(
        displayedFacturas.map((factura) => ({
          "Fecha factura": factura.fechaFactura,
          Número: factura.numero,
          Proveedor: proveedorNameById[factura.proveedorId] ?? String(factura.proveedorId),
          Comedor: comedorNameById[factura.comedorId] ?? String(factura.comedorId),
          "Punto de venta proveedor": factura.puntoDeVentaProveedor ?? "",
          "Distribución puntos comedor": formatFacturaDistribucion(
            factura.puntoDeVentaComedor,
            puntoDeVentaNameById,
          ),
          Monto: factura.monto,
          Estado: EstadoFacturaLabel[factura.estado],
          "Fecha emisión": factura.fechaEmision ?? "",
          "Fecha pago": factura.fechaPago ?? "",
          "Número operación": factura.numeroOperacion ?? "",
          "Medio de pago": factura.medioPago ?? "",
          Banco: factura.bancoNombre ?? "",
        })),
        "Compras",
        buildExportFilename("compras", [
          comedorFilter,
          selectedPuntoDeVenta?.nombre,
          buildDateRangePart(dateDesde, dateHasta),
          facturaStatusFilter !== "all" ? EstadoFacturaLabel[facturaStatusFilter] : null,
          buildSearchPart(facturaSearch),
        ]),
      );
      return;
    }

    if (view === "eventos") {
      exportRowsToXlsx(
        displayedEventos.map((e) => ({
          Fecha: e.fechaEvento,
          Comedor: comedorNameById[e.comedorId] ?? String(e.comedorId),
          "Tipo de evento": e.tipoEventoNombre ?? "",
          "Precio unitario": e.precioUnitario ?? "",
          Solicitante: e.solicitanteNombre ?? "",
          Funcionario: e.funcionarioNombre ?? "",
          Responsable: e.responsableNombre ?? "",
          "Cantidad personas": e.cantidadPersonas ?? "",
          "Monto total": e.montoTotal ?? "",
          Retenciones: e.retenciones ?? "",
          Estado: EstadoEventoLabel[e.estado],
          "Centro de costo": e.centroCosto ?? "",
          "Razón social": e.razonSocial ?? "",
          "Dest. facturación": e.destinatarioFacturacion ?? "",
          "Email solicitante": e.emailSolicitante ?? "",
          "Medio de pago": e.medioPago ?? "",
          "Nro. operación": e.numeroOperacion ?? "",
          "Tipo comprobante": e.tipoComprobante ?? "",
          "Nro. comprobante": e.numeroComprobante ?? "",
          Observaciones: e.observaciones ?? "",
          "Factura PDF": e.facturaPdfNombreArchivo ?? "",
        })),
        "Eventos",
        buildExportFilename("eventos", [
          comedorFilter,
          buildDateRangePart(dateDesde, dateHasta),
          eventoStatusFilter !== "all" ? EstadoEventoLabel[eventoStatusFilter] : null,
          buildSearchPart(eventoSearch),
        ]),
      );
      return;
    }

    const consumoRows: Record<string, unknown>[] = consumoViewMode === "grouped"
        ? groupedConsumos.map((item) => ({
            Fecha: item.fecha,
            Comedor: item.comedorNombre,
            Consumos: item.cantidadConsumos,
            Consumidores: item.cantidadConsumidores,
            "Puntos de venta": item.puntosDeVenta.join(", "),
            Total: item.total,
            Activos: item.activos,
            Anulados: item.anulados,
          }))
        : displayedConsumos.map((item) => ({
            Fecha: item.fecha,
            Comedor: item.comedorNombre,
            "Punto de venta": item.puntoDeVentaNombre,
            Consumidor: item.consumidorNombre,
            DNI: item.consumidorTaxId ?? "",
            Productos: item.productos.map((producto) => `${producto.producto.nombre} x${producto.cantidad}`).join(", "),
            Total: item.total,
            Estado: item.anulado ? "Anulado" : "Activo",
            Observaciones: item.observaciones ?? "",
          }));

    exportRowsToXlsx(
      consumoRows,
      "Consumos",
      buildExportFilename("consumos", [
        consumoViewMode === "grouped" ? "agrupado" : "detallado",
        comedorFilter,
        selectedPuntoDeVenta?.nombre,
        buildDateRangePart(dateDesde, dateHasta),
        consumoStatusFilter !== "all" ? consumoStatusExportLabel(consumoStatusFilter) : null,
        buildSearchPart(consumoSearch),
      ]),
    );
  };

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.replace("/login");
      if (session?.rol === "ENCARGADO") router.replace("/encargado");
    }
  }, [session, isLoading, router]);

  useEffect(() => {
    if (!session) return;
    apiFetch<DetailedCierreCajaResponse[]>("/api/cierres", {}, session.token)
      .then(setCierres)
      .finally(() => setLoadingCierres(false));
    apiFetch<PageResponse<FacturaProveedorResponse>>("/api/facturas/proveedor?size=10000", {}, session.token)
      .then((res) => setFacturas(res.content))
      .finally(() => setLoadingFacturas(false));
    apiFetch<ProveedorResponse[]>("/api/proveedores", {}, session.token).then(setProveedores);
    apiFetch<ComedorResponse[]>("/api/comedores", {}, session.token).then(setComedores);
    apiFetch<PuntoDeVentaResponse[]>("/api/comedores/puntos-de-venta", {}, session.token).then(setPuntosDeVenta);
    apiFetch<SociedadResponse[]>("/api/sociedades", {}, session.token).then(setSociedades);
    apiFetch<ConsumidorResponse[]>("/api/consumos/consumidores/all", {}, session.token)
      .then(setConsumidores)
      .catch(() => setConsumidores([]));
  }, [session]);

  useEffect(() => {
    if (!session) return;
    if (view !== "consumos" && !editarConsumo) return;

    apiFetch<ProductoResponse[]>("/api/consumos/productos", {}, session.token)
      .then(setProductosConsumo)
      .catch(() => setProductosConsumo([]));
  }, [session, view, editarConsumo]);

  useEffect(() => {
    if (!session) return;
    if (view !== "eventos") return;

    setLoadingEventos(true);
    apiFetch<EventoResponse[]>("/api/eventos", {}, session.token)
      .then(setEventos)
      .catch(() => setEventos([]))
      .finally(() => setLoadingEventos(false));
  }, [session, view]);

  useEffect(() => {
    if (!session || comedores.length === 0 || puntosDeVenta.length === 0) return;

    let cancelled = false;

    const loadConsumos = async () => {
      setLoadingConsumos(true);
      try {
        const path = dateDesde && dateHasta
          ? `/api/consumos/dates?fechaInicio=${dateDesde}&fechaFin=${dateHasta}`
          : "/api/consumos";
        const data = await apiFetch<ConsumoResponse[]>(path, {}, session.token);
        const enriched = enrichConsumos(
          data,
          comedores,
          puntosDeVenta,
          consumidores,
        );
        if (!cancelled) {
          setConsumos(enriched);
        }
      } catch {
        if (!cancelled) {
          setConsumos([]);
          toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudieron obtener los consumos.",
          });
        }
      } finally {
        if (!cancelled) {
          setLoadingConsumos(false);
        }
      }
    };

    loadConsumos();

    return () => {
      cancelled = true;
    };
  }, [session, comedores, puntosDeVenta, consumidores, dateDesde, dateHasta, toast]);

  const handleError = (err: unknown) => {
    if (ApiError.isUnauthorized(err)) return; // handled centrally by AuthProvider
    toast({
      variant: "destructive",
      title: "Error",
      description: err instanceof ApiError ? err.message : "No se pudo completar la operación.",
    });
  };

  const handleAnularCierre = async (cierreId: number, motivo: string) => {
    if (!session) return;
    try {
      await apiFetch(`/api/cierres/${cierreId}`,
        { method: "DELETE", body: JSON.stringify({ motivo }) }, session.token);
      setCierres((prev) => prev.map((c) =>
        c.id !== cierreId ? c : {
          ...c, anulacionId: cierreId, montoTotal: 0,
          movimientos: c.movimientos?.map((m) => ({ ...m, anulacionId: cierreId })) ?? [],
        }
      ));
      toast({ title: "Cierre anulado" });
    } catch (err) { handleError(err); throw err; }
  };

  const handleNuevaFactura = async (req: CreateFacturaProveedorRequest) => {
    if (!session) return;
    try {
      const nueva = await apiFetch<FacturaProveedorResponse>("/api/facturas/proveedor",
        { method: "POST", body: JSON.stringify(req) }, session.token);
      setFacturas((prev) => [nueva, ...prev]);
      toast({ title: "Factura creada", description: `Factura #${nueva.numero} creada correctamente.` });
    } catch (err) { handleError(err); throw err; }
  };

  const handleEmitir = async (facturaId: number, fechaEmision: string, fechaPago: string | null) => {
    if (!session) return;
    try {
      const updated = await apiFetch<FacturaProveedorResponse>(`/api/facturas/proveedor/${facturaId}/emitir`,
        { method: "PATCH", body: JSON.stringify({ fechaEmision, fechaPago }) }, session.token);
      setFacturas((prev) => prev.map((f) => f.id === facturaId ? updated : f));
      toast({ title: "Factura emitida" });
    } catch (err) { handleError(err); throw err; }
  };

  const handlePagar = async (facturaId: number, fechaPago: string | null) => {
    if (!session) return;
    try {
      const updated = await apiFetch<FacturaProveedorResponse>(`/api/facturas/proveedor/${facturaId}/pagar`,
        { method: "PATCH", body: JSON.stringify({ fechaPago }) }, session.token);
      setFacturas((prev) => prev.map((f) => f.id === facturaId ? updated : f));
      toast({ title: "Pago registrado" });
    } catch (err) { handleError(err); throw err; }
  };

  const handleEditar = async (facturaId: number, req: PatchFacturaProveedorRequest) => {
    if (!session) return;
    try {
      const updated = await apiFetch<FacturaProveedorResponse>(`/api/facturas/proveedor/${facturaId}`,
        { method: "PATCH", body: JSON.stringify(req) }, session.token);
      setFacturas((prev) => prev.map((f) => f.id === facturaId ? updated : f));
      toast({ title: "Factura actualizada" });
    } catch (err) { handleError(err); throw err; }
  };

  const handleAnularEvento = async (eventoId: number, motivo: string) => {
    if (!session) return;
    try {
      const updated = await apiFetch<EventoResponse>(`/api/eventos/${eventoId}/anular`,
        { method: "PATCH", body: JSON.stringify({ motivo }) }, session.token);
      setEventos((prev) => prev.map((e) => e.id === eventoId ? updated : e));
      toast({ title: "Evento anulado" });
    } catch (err) { handleError(err); throw err; }
  };

  const handleRealizarEvento = async (eventoId: number) => {
    if (!session) return;
    try {
      const updated = await apiFetch<EventoResponse>(`/api/eventos/${eventoId}/realizar`,
        { method: "PATCH" }, session.token);
      setEventos((prev) => prev.map((e) => e.id === eventoId ? updated : e));
      toast({ title: "Evento marcado como realizado" });
    } catch (err) { handleError(err); throw err; }
  };

  const handleEmitirEvento = async (eventoId: number, payload: EmitirEventoPayload) => {
    if (!session) return;
    try {
      const updated = await apiFetch<EventoResponse>(`/api/eventos/${eventoId}/emitir`,
        { method: "PATCH", body: JSON.stringify(payload) }, session.token);
      setEventos((prev) => prev.map((e) => e.id === eventoId ? updated : e));
      toast({ title: "Factura de evento emitida" });
    } catch (err) { handleError(err); throw err; }
  };

  const handlePagarEvento = async (eventoId: number, payload: PagarEventoPayload) => {
    if (!session) return;
    try {
      const updated = await apiFetch<EventoResponse>(`/api/eventos/${eventoId}/pagado`,
        { method: "PATCH", body: JSON.stringify(payload) }, session.token);
      setEventos((prev) => prev.map((e) => e.id === eventoId ? updated : e));
      toast({ title: "Pago del evento registrado" });
    } catch (err) { handleError(err); throw err; }
  };

  const handleEliminarPdfEvento = async (eventoId: number) => {
    if (!session) return;
    try {
      const updated = await apiFetch<EventoResponse>(`/api/eventos/${eventoId}/eliminar-factura-pdf`,
        { method: "PATCH" }, session.token);
      setEventos((prev) => prev.map((e) => e.id === eventoId ? updated : e));
      toast({ title: "PDF del evento eliminado" });
    } catch (err) { handleError(err); throw err; }
  };

  const handleAnularFactura = async (facturaId: number, motivo: string) => {
    if (!session) return;
    try {
      const updated = await apiFetch<FacturaProveedorResponse>(`/api/facturas/proveedor/${facturaId}`,
        { method: "DELETE", body: JSON.stringify({ motivo }) }, session.token);
      setFacturas((prev) => prev.map((f) => f.id === facturaId ? updated : f));
      toast({ title: "Factura anulada" });
    } catch (err) { handleError(err); throw err; }
  };

  const handleEditarConsumo = async (consumoId: number, req: PatchConsumoRequest) => {
    if (!session) return;
    try {
      const updated = await apiFetch<ConsumoResponse>(
        `/api/consumos/${consumoId}`,
        { method: "PATCH", body: JSON.stringify(req) },
        session.token,
      );
          setConsumos((prev) => prev.map((item) =>
        item.id === consumoId
          ? buildConsumoListItem(updated, comedores, puntosDeVenta, consumidores)
          : item,
      ));
      toast({ title: "Consumo actualizado" });
    } catch (err) { handleError(err); throw err; }
  };

  const handleAnularConsumo = async (consumoId: number, motivo: string) => {
    if (!session) return;
    try {
      const updated = await apiFetch<ConsumoResponse>(
        `/api/consumos/${consumoId}`,
        { method: "DELETE", body: JSON.stringify({ motivo }) },
        session.token,
      );
      setConsumos((prev) => prev.map((item) =>
        item.id === consumoId
          ? buildConsumoListItem(updated, comedores, puntosDeVenta, consumidores)
          : item,
      ));
      toast({ title: "Consumo anulado" });
    } catch (err) { handleError(err); throw err; }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-10 space-y-6">

        {!loadingCierres && !loadingFacturas && !loadingConsumos && (
          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
            <button
              type="button"
              onClick={() => setIngresosExpanded((current) => !current)}
              className={cn(
                "flex min-w-0 flex-col justify-start rounded-xl bg-white px-5 py-3 text-left shadow-sm transition hover:shadow-md",
                ingresosExpanded ? "h-auto self-start" : "h-[92px]",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Ingresos</p>
                  <p className="mt-1.5 overflow-hidden whitespace-nowrap text-[clamp(1.2rem,1.75vw,2rem)] font-bold leading-none tracking-tight text-emerald-600 tabular-nums">
                    {formatCurrency(montoIngresos)}
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-gray-500">
                  {ingresosExpanded ? "Ocultar detalle" : "Ver detalle"}
                  {ingresosExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </span>
              </div>

              {ingresosExpanded && (
                <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
                  <div className="flex items-start justify-between gap-4 text-sm text-gray-600">
                    <span>Cierres</span>
                    <span className="max-w-[60%] overflow-hidden whitespace-nowrap text-right font-semibold leading-tight text-emerald-700 tabular-nums">
                      {formatCurrency(montoVentas)}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4 text-sm text-gray-600">
                    <span>Eventos</span>
                    <span className="max-w-[60%] overflow-hidden whitespace-nowrap text-right font-semibold leading-tight text-green-700 tabular-nums">
                      {formatCurrency(montoEventos)}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4 text-sm text-gray-600">
                    <span>Consumos</span>
                    <span className="max-w-[60%] overflow-hidden whitespace-nowrap text-right font-semibold leading-tight text-lime-700 tabular-nums">
                      {formatCurrency(montoConsumos)}
                    </span>
                  </div>
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={() => setEgresosExpanded((current) => !current)}
              className={cn(
                "flex min-w-0 flex-col justify-start rounded-xl bg-white px-5 py-3 text-left shadow-sm transition hover:shadow-md",
                egresosExpanded ? "h-auto self-start" : "h-[92px]",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Egresos</p>
                  <p className="mt-1.5 overflow-hidden whitespace-nowrap text-[clamp(1.2rem,1.75vw,2rem)] font-bold leading-none tracking-tight text-red-500 tabular-nums">
                    {formatCurrency(montoEgresos)}
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-gray-500">
                  {egresosExpanded ? "Ocultar detalle" : "Ver detalle"}
                  {egresosExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </span>
              </div>

              {egresosExpanded && (
                <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
                  <div className="flex items-start justify-between gap-4 text-sm text-gray-600">
                    <span>Compras</span>
                    <span className="max-w-[60%] overflow-hidden whitespace-nowrap text-right font-semibold leading-tight text-red-500 tabular-nums">
                      {formatCurrency(montoCompras)}
                    </span>
                  </div>
                </div>
              )}
            </button>

            <button
              type="button"
              className="flex h-[92px] min-w-0 flex-col justify-start rounded-xl bg-white px-5 py-3 text-left shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Total</p>
                  <p className={cn(
                    "mt-1.5 overflow-hidden whitespace-nowrap text-[clamp(1.2rem,1.75vw,2rem)] font-bold leading-none tracking-tight tabular-nums",
                    totalGeneral >= 0 ? "text-blue-700" : "text-red-600",
                  )}>
                    {formatCurrency(totalGeneral)}
                  </p>
                </div>
                <span className="invisible inline-flex shrink-0 items-center gap-1 text-xs font-medium">
                  Ver detalle
                  <ChevronDown className="h-4 w-4" />
                </span>
              </div>
            </button>
          </div>
        )}

        <div className="flex justify-start gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/contabilidad/catalogo")}
            className="gap-2 border-gray-200 text-sm font-semibold"
          >
            <LibraryBig className="h-4 w-4" />
            Catálogo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/contabilidad/importaciones")}
            className="gap-2 border-gray-200 text-sm font-semibold"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Importaciones
          </Button>
        </div>

        <Card className="border-0 shadow-md rounded-xl">
          <CardHeader className="border-b px-6 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-gray-800">Contabilidad</CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
                  {(["cierres", "compras", "eventos", "consumos"] as View[]).map((v) => (
                    <button key={v} onClick={() => setView(v)}
                      className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                        view === v ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                      )}>
                      {v === "cierres"
                        ? "Cierres"
                        : v === "compras"
                          ? "Compras"
                          : v === "eventos"
                            ? "Eventos"
                            : "Consumos"}
                    </button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCurrentView}
                  disabled={
                    view === "cierres"
                      ? loadingCierres || displayedCierres.length === 0
                      : view === "compras"
                        ? loadingFacturas || displayedFacturas.length === 0
                      : view === "eventos"
                          ? loadingEventos || displayedEventos.length === 0
                          : loadingConsumos || (
                            consumoViewMode === "grouped"
                              ? groupedConsumos.length === 0
                              : displayedConsumos.length === 0
                          )
                  }
                  className="gap-2 bg-black text-white hover:bg-black/90"
                >
                  <Download className="h-4 w-4" />
                  Descargar Excel
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <DatePickerInput value={dateDesde} onChange={setDateDesde}
                  className="h-8 w-36 text-sm bg-gray-50 border-gray-200" />
                <span className="text-xs text-gray-400">—</span>
                <DatePickerInput value={dateHasta} onChange={setDateHasta}
                  className="h-8 w-36 text-sm bg-gray-50 border-gray-200" />
              </div>
              {sociedadOptions.length > 0 && (
                <Combobox
                  options={sociedadOptions.map((s) => ({ value: String(s.id), label: s.nombre }))}
                  value={sociedadFilter}
                  onChange={(v) => {
                    setSociedadFilter(v);
                    setComedorFilter("");
                    setPuntoDeVentaFilter("");
                  }}
                  placeholder="Todas las sociedades"
                  className="h-8 w-auto min-w-44 text-sm bg-gray-50 border-gray-200"
                />
              )}
              <Combobox
                options={comedorOptions.map((n) => ({ value: n, label: n }))}
                value={comedorFilter}
                onChange={(value) => {
                  setComedorFilter(value);
                  setPuntoDeVentaFilter("");
                }}
                placeholder="Todos los comedores"
                className="h-8 w-auto min-w-48 text-sm bg-gray-50 border-gray-200"
              />
              {puntoDeVentaOptions.length > 0 && (
                <Combobox
                  options={puntoDeVentaOptions.map((puntoDeVenta) => ({
                    value: String(puntoDeVenta.id),
                    label: puntoDeVenta.nombre,
                  }))}
                  value={puntoDeVentaFilter}
                  onChange={setPuntoDeVentaFilter}
                  placeholder="Todos los puntos de venta"
                  searchPlaceholder="Buscar punto de venta..."
                  className="h-8 w-auto min-w-56 text-sm bg-gray-50 border-gray-200"
                />
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {view === "cierres" && (
              <CierresTable
                cierres={cierres}
                displayedCierres={displayedCierres}
                loading={loadingCierres}
                search={search}
                onSearchChange={setSearch}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={(key) => {
                  if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                  else { setSortKey(key); setSortDir("asc"); }
                }}
                comedorFilter={comedorFilter}
                onComedorFilterChange={setComedorFilter}
                onClearFilters={clearFilters}
                onEditar={(id) => {
                  const found = cierres.find((c) => c.id === id);
                  if (found) setEditarCierreModal(found);
                }}
                onAnular={(cierre) => setAnularCierreModal({
                  open: true, cierreId: cierre.id,
                  fechaOperacion: cierre.fechaOperacion, puntoVenta: cierre.puntoDeVenta.nombre,
                })}
              />
            )}
            {view === "compras" && (
              <FacturasTable
                facturas={facturas}
                displayedFacturas={displayedFacturas}
                proveedores={proveedores}
                loading={loadingFacturas}
                comedorNameById={comedorNameById}
                puntoDeVentaNameById={puntoDeVentaNameById}
                dateDesde={dateDesde}
                dateHasta={dateHasta}
                comedorIdFilter={comedorIdFilter}
                search={facturaSearch}
                onSearchChange={setFacturaSearch}
                statusFilter={facturaStatusFilter}
                onStatusFilterChange={setFacturaStatusFilter}
                sortKey={facturaSortKey}
                sortDir={facturaSortDir}
                onSort={(key) => {
                  if (key === facturaSortKey) setFacturaSortDir((direction) => (direction === "asc" ? "desc" : "asc"));
                  else { setFacturaSortKey(key); setFacturaSortDir("asc"); }
                }}
                onEmitir={setEmitirFactura}
                onPagar={setPagarFactura}
                onEditar={setEditarFactura}
                onAnular={setAnularFactura}
                extraActiveFilters={Boolean(puntoDeVentaFilter)}
                onClearFilters={clearFilters}
              />
            )}
            {view === "eventos" && (
              <EventosTable
                eventos={eventos}
                displayedEventos={displayedEventos}
                comedorNameById={comedorNameById}
                loading={loadingEventos}
                search={eventoSearch}
                onSearchChange={setEventoSearch}
                statusFilter={eventoStatusFilter}
                onStatusFilterChange={setEventoStatusFilter}
                sortKey={eventoSortKey}
                sortDir={eventoSortDir}
                onSort={(key) => {
                  if (key === eventoSortKey) setEventoSortDir((d) => (d === "asc" ? "desc" : "asc"));
                  else { setEventoSortKey(key); setEventoSortDir("asc"); }
                }}
                onRealizar={setRealizarEvento}
                onEmitir={setEmitirEvento}
                onPagar={setPagarEvento}
                onEliminarPdf={setEliminarPdfEvento}
                onAnular={setAnularEvento}
                onClearFilters={clearFilters}
              />
            )}
            {view === "consumos" && (
              <div>
                <div className="border-b px-6 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                      <Input
                        value={consumoSearch}
                        onChange={(event) => setConsumoSearch(event.target.value)}
                        placeholder="Buscar por comedor, consumidor o punto de venta..."
                        className="h-8 w-72 bg-gray-50 pl-8 pr-8 text-sm border-gray-200"
                      />
                      {consumoSearch && (
                        <button
                          onClick={() => setConsumoSearch("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
                      {(["all", "active", "anulado"] as ConsumoStatusFilter[]).map((status) => (
                        <button
                          key={status}
                          onClick={() => setConsumoStatusFilter(status)}
                          className={cn(
                            "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                            consumoStatusFilter === status
                              ? "bg-white shadow-sm text-gray-900"
                              : "text-gray-500 hover:text-gray-700",
                          )}
                        >
                          {consumoStatusLabel[status]}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
                      {(["grouped", "detailed"] as ConsumoViewMode[]).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setConsumoViewMode(mode)}
                          className={cn(
                            "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                            consumoViewMode === mode
                              ? "bg-white shadow-sm text-gray-900"
                              : "text-gray-500 hover:text-gray-700",
                          )}
                        >
                          {mode === "grouped" ? "Agrupado" : "Detallado"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {loadingConsumos ? (
                  <div className="flex justify-center py-16">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : consumoViewMode === "grouped" ? (
                  groupedConsumos.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
                      <SlidersHorizontal className="h-8 w-8 opacity-40" />
                      <p className="text-sm">
                        {consumos.length === 0
                          ? "No hay consumos registrados"
                          : "Ningún consumo coincide con los filtros"}
                      </p>
                      {consumos.length > 0 && (
                        <button
                          onClick={clearFilters}
                          className="text-xs text-primary underline-offset-2 hover:underline"
                        >
                          Limpiar filtros
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="border-b bg-gray-50/60 px-6 py-2">
                        <p className="text-xs text-gray-500">
                          {displayedConsumos.length} consumo{displayedConsumos.length !== 1 ? "s" : ""} en{" "}
                          {groupedConsumos.length} grupo{groupedConsumos.length !== 1 ? "s" : ""}
                          {consumoHasActiveFilters && (
                            <button
                              onClick={clearFilters}
                              className="ml-2 text-primary underline-offset-2 hover:underline"
                            >
                              Limpiar filtros
                            </button>
                          )}
                        </p>
                      </div>

                      <Table className="w-full">
                        <TableHeader>
                          <TableRow className="bg-gray-100/80 text-xs uppercase tracking-wider text-gray-500 hover:bg-gray-100/80">
                            <TableHead className="px-6 py-3">Fecha</TableHead>
                            <TableHead className="px-4 py-3">Comedor</TableHead>
                            <TableHead className="px-4 py-3">Resumen</TableHead>
                            <TableHead className="px-4 py-3">Puntos de venta</TableHead>
                            <TableHead className="px-4 py-3 text-right">Total</TableHead>
                            <TableHead className="px-4 py-3 text-right">Estado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupedConsumos.map((group) => (
                            <TableRow key={group.key} className="hover:bg-gray-50/80">
                              <TableCell className="px-6 py-4 align-top font-medium">
                                {group.fecha}
                              </TableCell>
                              <TableCell className="px-4 py-4 align-top">
                                <div className="font-medium text-gray-900">{group.comedorNombre}</div>
                              </TableCell>
                              <TableCell className="px-4 py-4 align-top">
                                <div className="font-medium text-gray-900">
                                  {group.cantidadConsumos} consumo{group.cantidadConsumos !== 1 ? "s" : ""}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {group.cantidadConsumidores} consumidor{group.cantidadConsumidores !== 1 ? "es" : ""}
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-4 align-top">
                                <div className="max-w-xs text-sm text-gray-700">
                                  {formatSummaryNames(group.puntosDeVenta)}
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-4 text-right align-top font-semibold text-gray-900">
                                {formatCurrency(group.total)}
                              </TableCell>
                              <TableCell className="px-4 py-4 align-top">
                                <div className="flex justify-end">
                                  {group.anulados === 0 ? (
                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                      Activos
                                    </Badge>
                                  ) : group.activos === 0 ? (
                                    <Badge className="bg-red-100 text-red-600 hover:bg-red-100">
                                      Anulados
                                    </Badge>
                                  ) : (
                                    <div className="text-right">
                                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                                        Mixto
                                      </Badge>
                                      <p className="mt-1 text-xs text-gray-500">
                                        {group.activos} act. / {group.anulados} an.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </>
                  )
                ) : (
                  <ConsumosTable
                    consumos={consumos}
                    displayedConsumos={displayedConsumos}
                    loading={loadingConsumos}
                    hideToolbar
                    search={consumoSearch}
                    onSearchChange={setConsumoSearch}
                    statusFilter={consumoStatusFilter}
                    onStatusFilterChange={setConsumoStatusFilter}
                    sortKey={consumoSortKey}
                    sortDir={consumoSortDir}
                    onSort={(key) => {
                      if (key === consumoSortKey) setConsumoSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
                      else { setConsumoSortKey(key); setConsumoSortDir("asc"); }
                    }}
                    onEditar={setEditarConsumo}
                    onAnular={setAnularConsumo}
                    onClearFilters={clearFilters}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {anularCierreModal && (
        <AnularCierreModal
          open={anularCierreModal.open}
          onClose={() => setAnularCierreModal((p) => p && { ...p, open: false })}
          cierreId={anularCierreModal.cierreId}
          fechaOperacion={anularCierreModal.fechaOperacion}
          puntoVenta={anularCierreModal.puntoVenta}
          onConfirm={handleAnularCierre}
        />
      )}

      {editarCierreModal && (
        <EditarCierreModal
          open={!!editarCierreModal}
          onClose={() => setEditarCierreModal(null)}
          cierre={editarCierreModal}
          comedores={comedores}
          puntosDeVenta={puntosDeVenta}
          onSuccess={() => {
            apiFetch<DetailedCierreCajaResponse[]>("/api/cierres", {}, session!.token).then(setCierres);
          }}
        />
      )}

      <NuevaFacturaModal open={nuevaFacturaOpen} onClose={() => setNuevaFacturaOpen(false)}
        proveedores={proveedores} comedores={comedores} onConfirm={handleNuevaFactura} />

      {emitirFactura && (
        <EmitirFacturaModal open={!!emitirFactura} onClose={() => setEmitirFactura(null)}
          facturaId={emitirFactura.id} numeroFactura={emitirFactura.numero} onConfirm={handleEmitir} />
      )}
      {pagarFactura && (
        <PagarFacturaModal open={!!pagarFactura} onClose={() => setPagarFactura(null)}
          facturaId={pagarFactura.id} numeroFactura={pagarFactura.numero}
          currentFechaPago={pagarFactura.fechaPago} onConfirm={handlePagar} />
      )}
      {editarFactura && (
        <EditarFacturaModal open={!!editarFactura} onClose={() => setEditarFactura(null)}
          factura={editarFactura} proveedores={proveedores} comedores={comedores} onConfirm={handleEditar} />
      )}
      {anularFactura && (
        <AnularFacturaModal open={!!anularFactura} onClose={() => setAnularFactura(null)}
          facturaId={anularFactura.id} numeroFactura={anularFactura.numero} onConfirm={handleAnularFactura} />
      )}
      {anularEvento && (
        <AnularEventoModal
          open={!!anularEvento}
          onClose={() => setAnularEvento(null)}
          eventoId={anularEvento.id}
          fechaEvento={anularEvento.fechaEvento}
          comedorNombre={comedorNameById[anularEvento.comedorId] ?? String(anularEvento.comedorId)}
          onConfirm={handleAnularEvento}
        />
      )}
      {realizarEvento && (
        <RealizarEventoModal
          open={!!realizarEvento}
          onClose={() => setRealizarEvento(null)}
          eventoId={realizarEvento.id}
          fechaEvento={realizarEvento.fechaEvento}
          comedorNombre={comedorNameById[realizarEvento.comedorId] ?? String(realizarEvento.comedorId)}
          onConfirm={handleRealizarEvento}
        />
      )}
      {emitirEvento && (
        <EmitirEventoModal
          open={!!emitirEvento}
          onClose={() => setEmitirEvento(null)}
          evento={emitirEvento}
          onConfirm={handleEmitirEvento}
        />
      )}
      {pagarEvento && (
        <PagarEventoModal
          open={!!pagarEvento}
          onClose={() => setPagarEvento(null)}
          evento={pagarEvento}
          onConfirm={handlePagarEvento}
        />
      )}
      {eliminarPdfEvento && (
        <EliminarPdfEventoModal
          open={!!eliminarPdfEvento}
          onClose={() => setEliminarPdfEvento(null)}
          eventoId={eliminarPdfEvento.id}
          nombreArchivo={eliminarPdfEvento.facturaPdfNombreArchivo ?? "PDF"}
          onConfirm={handleEliminarPdfEvento}
        />
      )}
      {editarConsumo && (
        <EditarConsumoModal
          open={!!editarConsumo}
          onClose={() => setEditarConsumo(null)}
          consumo={editarConsumo}
          comedores={comedores}
          puntosDeVenta={puntosDeVenta}
          consumidores={consumidores}
          productos={productosConsumo}
          onConfirm={handleEditarConsumo}
        />
      )}
      {anularConsumo && (
        <AnularConsumoModal
          open={!!anularConsumo}
          onClose={() => setAnularConsumo(null)}
          consumoId={anularConsumo.id}
          fecha={anularConsumo.fecha}
          consumidorNombre={anularConsumo.consumidorNombre}
          onConfirm={handleAnularConsumo}
        />
      )}
    </div>
  );
}
