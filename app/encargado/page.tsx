
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/models/dto/ApiError";
import { DetailedCierreCajaResponse } from "@/models/dto/cierre-caja/CierreCajaResponse";
import { FacturaProveedorResponse } from "@/models/dto/compra/FacturaProveedorResponse";
import { ProveedorResponse } from "@/models/dto/proveedor/ProveedorResponse";
import { ComedorResponse } from "@/models/dto/comedor/ComedorResponse";
import { CreateFacturaProveedorRequest } from "@/models/dto/compra/CreateFacturaProveedorRequest";
import { CierresTable } from "@/components/cierres-table";
import { FacturaSortDir, FacturaSortKey, FacturaStatusFilter, FacturasTable } from "@/components/facturas-table";
import { EventosTable, EventoSortKey, EventoSortDir, EventoStatusFilter } from "@/components/eventos-table";
import { ConsumosTable, ConsumoSortDir, ConsumoSortKey, ConsumoStatusFilter } from "@/components/consumos-table";
import { NuevaFacturaModal } from "@/components/nueva-factura-modal";
import { NuevoCierreModal } from "@/components/nuevo-cierre-modal";
import { NuevoEventoModal } from "@/components/nuevo-evento-modal";
import { NuevoConsumoModal } from "@/components/nuevo-consumo-modal";
import { PuntoDeVentaResponse } from "@/models/dto/pto-venta/PuntoDeVentaResponse";
import { EventoResponse } from "@/models/dto/evento/EventoResponse";
import { CreateEventoRequest } from "@/models/dto/evento/CreateEventoRequest";
import { ConsumoResponse } from "@/models/dto/consumos/ConsumoResponse";
import { ConsumidorResponse } from "@/models/dto/consumos/ConsumidorResponse";
import { ProductoResponse } from "@/models/dto/consumos/ProductoResponse";
import { CreateConsumoRequest } from "@/models/dto/consumos/CreateConsumoRequest";
import { buildConsumoListItem, ConsumoListItem, enrichConsumos } from "@/lib/consumos";
import { DatePickerInput } from "@/components/date-picker-input";
import { Combobox } from "@/components/ui/combobox";
import { facturaTienePuntoDeVentaComedor } from "@/lib/facturas";

type View = "cierres" | "compras" | "eventos" | "consumos";

export default function EncargadoPage() {
  const router = useRouter();
  const { session, isLoading } = useAuth();
  const { toast } = useToast();

  const [view, setView] = useState<View>("cierres");

  // shared filters
  const [dateDesde, setDateDesde] = useState("");
  const [dateHasta, setDateHasta] = useState("");
  const [comedorFilter, setComedorFilter] = useState("");
  const [puntoDeVentaFilter, setPuntoDeVentaFilter] = useState("");

  // cierres
  const [cierres, setCierres] = useState<DetailedCierreCajaResponse[]>([]);
  const [loadingCierres, setLoadingCierres] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "anulado">("active");
  const [sortKey, setSortKey] = useState<"fechaOperacion" | "comedor" | "creadoPor" | "puntoDeVenta" | "totalPlatosVendidos" | "montoTotal">("fechaOperacion");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // compras
  const [facturas, setFacturas] = useState<FacturaProveedorResponse[]>([]);
  const [loadingFacturas, setLoadingFacturas] = useState(true);
  const [proveedores, setProveedores] = useState<ProveedorResponse[]>([]);
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [puntosDeVenta, setPuntosDeVenta] = useState<PuntoDeVentaResponse[]>([]);
  const [nuevaFacturaOpen, setNuevaFacturaOpen] = useState(false);
  const [nuevoCierreOpen, setNuevoCierreOpen] = useState(false);
  const [facturaSearch, setFacturaSearch] = useState("");
  const [facturaStatusFilter, setFacturaStatusFilter] = useState<FacturaStatusFilter>("all");
  const [facturaSortKey, setFacturaSortKey] = useState<FacturaSortKey>("fechaFactura");
  const [facturaSortDir, setFacturaSortDir] = useState<FacturaSortDir>("desc");

  // eventos
  const [eventos, setEventos] = useState<EventoResponse[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(true);
  const [nuevoEventoOpen, setNuevoEventoOpen] = useState(false);
  const [eventoSearch, setEventoSearch] = useState("");
  const [eventoStatusFilter, setEventoStatusFilter] = useState<EventoStatusFilter>("all");
  const [eventoSortKey, setEventoSortKey] = useState<EventoSortKey>("fechaEvento");
  const [eventoSortDir, setEventoSortDir] = useState<EventoSortDir>("desc");

  // consumos
  const [consumos, setConsumos] = useState<ConsumoListItem[]>([]);
  const [loadingConsumos, setLoadingConsumos] = useState(true);
  const [consumidores, setConsumidores] = useState<ConsumidorResponse[]>([]);
  const [productosConsumo, setProductosConsumo] = useState<ProductoResponse[]>([]);
  const [nuevoConsumoOpen, setNuevoConsumoOpen] = useState(false);
  const [consumoSearch, setConsumoSearch] = useState("");
  const [consumoStatusFilter, setConsumoStatusFilter] =
    useState<ConsumoStatusFilter>("active");
  const [consumoSortKey, setConsumoSortKey] =
    useState<ConsumoSortKey>("fecha");
  const [consumoSortDir, setConsumoSortDir] =
    useState<ConsumoSortDir>("desc");

  const comedorIdFilter = useMemo(
    () => comedores.find((c) => c.nombre === comedorFilter)?.id ?? null,
    [comedores, comedorFilter],
  );

  const comedorNameById = useMemo(
    () => Object.fromEntries(comedores.map((c) => [c.id, c.nombre])),
    [comedores],
  );

  const proveedorNameById = useMemo(
    () => Object.fromEntries(proveedores.map((proveedor) => [proveedor.id, proveedor.nombre])),
    [proveedores],
  );

  const puntoDeVentaNameById = useMemo(
    () => Object.fromEntries(puntosDeVenta.map((puntoDeVenta) => [puntoDeVenta.id, puntoDeVenta.nombre])),
    [puntosDeVenta],
  );

  const puntoDeVentaOptions = useMemo(() => {
    let list = [...puntosDeVenta];
    if (comedorIdFilter !== null) list = list.filter((puntoDeVenta) => puntoDeVenta.comedorId === comedorIdFilter);
    return list.sort((left, right) => left.nombre.localeCompare(right.nombre));
  }, [puntosDeVenta, comedorIdFilter]);

  useEffect(() => {
    if (puntoDeVentaFilter && !puntoDeVentaOptions.some((puntoDeVenta) => String(puntoDeVenta.id) === puntoDeVentaFilter)) {
      setPuntoDeVentaFilter("");
    }
  }, [puntoDeVentaFilter, puntoDeVentaOptions]);

  const displayedEventos = useMemo(() => {
    let list = [...eventos];
    if (eventoStatusFilter !== "all") list = list.filter((e) => e.estado === eventoStatusFilter);
    if (eventoSearch.trim()) {
      const q = eventoSearch.trim().toLowerCase();
      list = list.filter((e) =>
        (comedorNameById[e.comedorId] ?? "").toLowerCase().includes(q) ||
        (e.solicitante ?? "").toLowerCase().includes(q) ||
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
  }, [eventos, eventoStatusFilter, eventoSearch, eventoSortKey, eventoSortDir, comedorNameById]);

  const displayedConsumos = useMemo(() => {
    let list = [...consumos];
    if (consumoStatusFilter === "active") list = list.filter((item) => !item.anulado);
    if (consumoStatusFilter === "anulado") list = list.filter((item) => item.anulado);
    if (comedorFilter) list = list.filter((item) => item.comedorNombre === comedorFilter);
    if (puntoDeVentaFilter) list = list.filter((item) => String(item.PuntoDeVentaId) === puntoDeVentaFilter);
    if (dateDesde) list = list.filter((item) => item.fecha >= dateDesde);
    if (dateHasta) list = list.filter((item) => item.fecha <= dateHasta);
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
    comedorFilter,
    consumoSearch,
    consumoSortDir,
    consumoSortKey,
    consumoStatusFilter,
    consumos,
    dateDesde,
    dateHasta,
    puntoDeVentaFilter,
  ]);

  const comedorOptions = useMemo(
    () => [...new Set([
      ...cierres.map((c) => c.comedor.nombre),
      ...comedores.map((c) => c.nombre),
    ])].sort(),
    [cierres, comedores],
  );

  const displayedCierres = useMemo(() => {
    let list = [...cierres];
    if (statusFilter === "active") list = list.filter((c) => c.anulacionId === null);
    if (statusFilter === "anulado") list = list.filter((c) => c.anulacionId !== null);
    if (comedorFilter) list = list.filter((c) => c.comedor.nombre === comedorFilter);
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
  }, [cierres, statusFilter, comedorFilter, dateDesde, dateHasta, puntoDeVentaFilter, search, sortKey, sortDir]);

  const displayedFacturas = useMemo(() => {
    let list = [...facturas];
    if (dateDesde) list = list.filter((factura) => factura.fechaFactura >= dateDesde);
    if (dateHasta) list = list.filter((factura) => factura.fechaFactura <= dateHasta);
    if (comedorIdFilter !== null) list = list.filter((factura) => factura.comedorId === comedorIdFilter);
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
  ]);

  const clearFilters = () => {
    setDateDesde(""); setDateHasta(""); setComedorFilter(""); setPuntoDeVentaFilter("");
    setSearch(""); setStatusFilter("active");
    setFacturaSearch(""); setFacturaStatusFilter("all");
    setEventoSearch(""); setEventoStatusFilter("all");
    setConsumoSearch(""); setConsumoStatusFilter("active");
  };

  const handleNuevoEvento = async (req: CreateEventoRequest) => {
    if (!session) return;
    try {
      const nuevo = await apiFetch<EventoResponse>(
        "/api/eventos",
        { method: "POST", body: JSON.stringify(req) },
        session.token,
      );
      setEventos((prev) => [nuevo, ...prev]);
      toast({ title: "Evento creado" });
    } catch (err) {
      if (ApiError.isUnauthorized(err)) return; // handled centrally by AuthProvider
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof ApiError ? err.message : "No se pudo crear el evento.",
      });
      throw err;
    }
  };

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.replace("/login");
      if (session?.rol === "CONTABILIDAD") router.replace("/contabilidad");
    }
  }, [session, isLoading, router]);

  useEffect(() => {
    if (!session) return;
    apiFetch<DetailedCierreCajaResponse[]>("/api/cierres/mine", {}, session.token)
      .then(setCierres)
      .finally(() => setLoadingCierres(false));
    apiFetch<FacturaProveedorResponse[]>("/api/facturas/proveedor/mis-facturas", {}, session.token)
      .then(setFacturas)
      .finally(() => setLoadingFacturas(false));
    apiFetch<ProveedorResponse[]>("/api/proveedores", {}, session.token).then(setProveedores);
    apiFetch<ComedorResponse[]>("/api/comedores", {}, session.token).then(setComedores);
    apiFetch<PuntoDeVentaResponse[]>("/api/comedores/puntos-de-venta", {}, session.token).then(setPuntosDeVenta);
    apiFetch<ConsumidorResponse[]>("/api/consumos/consumidores/all", {}, session.token)
      .then(setConsumidores)
      .catch(() => setConsumidores([]));
    apiFetch<ProductoResponse[]>("/api/consumos/productos", {}, session.token)
      .then(setProductosConsumo)
      .catch(() => setProductosConsumo([]));
    apiFetch<EventoResponse[]>("/api/eventos/mis-cierres", {}, session.token)
      .then(setEventos)
      .catch(() => setEventos([]))
      .finally(() => setLoadingEventos(false));
  }, [session]);

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

  const handleNuevaFactura = async (req: CreateFacturaProveedorRequest) => {
    if (!session) return;
    try {
      const nueva = await apiFetch<FacturaProveedorResponse>(
        "/api/facturas/proveedor",
        { method: "POST", body: JSON.stringify(req) },
        session.token,
      );
      setFacturas((prev) => [nueva, ...prev]);
      toast({ title: "Factura creada", description: `Factura #${nueva.numero} creada correctamente.` });
    } catch (err) {
      if (ApiError.isUnauthorized(err)) return; // handled centrally by AuthProvider
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof ApiError ? err.message : "No se pudo crear la factura.",
      });
      throw err;
    }
  };

  const handleNuevoConsumo = async (req: CreateConsumoRequest) => {
    if (!session) return;
    try {
      const nuevo = await apiFetch<ConsumoResponse>(
        "/api/consumos",
        { method: "POST", body: JSON.stringify(req) },
        session.token,
      );
      const enriched = buildConsumoListItem(
        nuevo,
        comedores,
        puntosDeVenta,
        consumidores,
      );
      setConsumos((prev) => [enriched, ...prev]);
      toast({ title: "Consumo creado" });
    } catch (err) {
      if (ApiError.isUnauthorized(err)) return;
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof ApiError ? err.message : "No se pudo crear el consumo.",
      });
      throw err;
    }
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
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Card className="border-0 shadow-md rounded-xl">
          <CardHeader className="border-b px-6 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-gray-800">
                {view === "cierres"
                  ? "Tus Cierres"
                  : view === "compras"
                    ? "Tus Compras"
                    : view === "eventos"
                      ? "Tus Eventos"
                      : "Tus Consumos"}
              </CardTitle>
              <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
                {(["cierres", "compras", "eventos", "consumos"] as View[]).map((v) => (
                  <button key={v} onClick={() => setView(v)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                      view === v ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700",
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
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <DatePickerInput value={dateDesde} onChange={setDateDesde}
                  className="h-8 w-36 text-sm bg-gray-50 border-gray-200" />
                <span className="text-xs text-gray-400">—</span>
                <DatePickerInput value={dateHasta} onChange={setDateHasta}
                  className="h-8 w-36 text-sm bg-gray-50 border-gray-200" />
              </div>
              {comedorOptions.length > 1 && (
                <Combobox
                  options={comedorOptions.map((n) => ({ value: n, label: n }))}
                  value={comedorFilter}
                  onChange={(value) => {
                    setComedorFilter(value);
                    setPuntoDeVentaFilter("");
                  }}
                  placeholder="Todos los comedores"
                  searchPlaceholder="Buscar comedor..."
                  className="h-8 w-auto min-w-48 text-sm bg-gray-50 border-gray-200"
                />
              )}
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
                readonly
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
                onNuevoCierre={() => setNuevoCierreOpen(true)}
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
                readonly
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
                  if (key === facturaSortKey) setFacturaSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
                  else { setFacturaSortKey(key); setFacturaSortDir("asc"); }
                }}
                onNuevaFactura={() => setNuevaFacturaOpen(true)}
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
                readonly
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
                onNuevoEvento={() => setNuevoEventoOpen(true)}
                onClearFilters={clearFilters}
              />
            )}
            {view === "consumos" && (
              <ConsumosTable
                consumos={consumos}
                displayedConsumos={displayedConsumos}
                loading={loadingConsumos}
                readonly
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
                onNuevoConsumo={() => setNuevoConsumoOpen(true)}
                onClearFilters={clearFilters}
              />
            )}
          </CardContent>
        </Card>
      </main>

      <NuevaFacturaModal
        open={nuevaFacturaOpen}
        onClose={() => setNuevaFacturaOpen(false)}
        proveedores={proveedores}
        comedores={comedores}
        onConfirm={handleNuevaFactura}
      />

      <NuevoCierreModal
        open={nuevoCierreOpen}
        onClose={() => setNuevoCierreOpen(false)}
        comedores={comedores}
        puntosDeVenta={puntosDeVenta}
        onSuccess={() => {
          apiFetch<DetailedCierreCajaResponse[]>("/api/cierres", {}, session!.token).then(setCierres);
        }}
      />

      <NuevoEventoModal
        open={nuevoEventoOpen}
        onClose={() => setNuevoEventoOpen(false)}
        token={session.token}
        comedores={comedores}
        onConfirm={handleNuevoEvento}
      />

      <NuevoConsumoModal
        open={nuevoConsumoOpen}
        onClose={() => setNuevoConsumoOpen(false)}
        comedores={comedores}
        puntosDeVenta={puntosDeVenta}
        consumidores={consumidores}
        productos={productosConsumo}
        onConfirm={handleNuevoConsumo}
      />
    </div>
  );
}
