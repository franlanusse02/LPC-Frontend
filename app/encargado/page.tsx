
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/header";
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
import { CreateFacturaProveedorRequest } from "@/models/dto/compra/CreateFacturaProveedorRequest";
import { CierresTable } from "@/components/cierres-table";
import { FacturasTable } from "@/components/facturas-table";
import { EventosTable, EventoSortKey, EventoSortDir, EventoStatusFilter } from "@/components/eventos-table";
import { NuevaFacturaModal } from "@/components/nueva-factura-modal";
import { NuevoCierreModal } from "@/components/nuevo-cierre-modal";
import { NuevoEventoModal } from "@/components/nuevo-evento-modal";
import { PuntoDeVentaResponse } from "@/models/dto/pto-venta/PuntoDeVentaResponse";
import { EventoResponse } from "@/models/dto/evento/EventoResponse";
import { CreateEventoRequest } from "@/models/dto/evento/CreateEventoRequest";

type View = "cierres" | "compras" | "eventos";

export default function EncargadoPage() {
  const router = useRouter();
  const { session, isLoading, logout } = useAuth();
  const { toast } = useToast();

  const [view, setView] = useState<View>("cierres");

  // shared filters
  const [dateDesde, setDateDesde] = useState("");
  const [dateHasta, setDateHasta] = useState("");
  const [comedorFilter, setComedorFilter] = useState("");

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

  // eventos
  const [eventos, setEventos] = useState<EventoResponse[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(true);
  const [nuevoEventoOpen, setNuevoEventoOpen] = useState(false);
  const [eventoSearch, setEventoSearch] = useState("");
  const [eventoStatusFilter, setEventoStatusFilter] = useState<EventoStatusFilter>("all");
  const [eventoSortKey, setEventoSortKey] = useState<EventoSortKey>("fechaEvento");
  const [eventoSortDir, setEventoSortDir] = useState<EventoSortDir>("desc");

  const comedorIdFilter = useMemo(
    () => comedores.find((c) => c.nombre === comedorFilter)?.id ?? null,
    [comedores, comedorFilter],
  );

  const comedorNameById = useMemo(
    () => Object.fromEntries(comedores.map((c) => [c.id, c.nombre])),
    [comedores],
  );

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
  }, [cierres, statusFilter, comedorFilter, dateDesde, dateHasta, search, sortKey, sortDir]);

  const clearFilters = () => {
    setDateDesde(""); setDateHasta(""); setComedorFilter("");
    setSearch(""); setStatusFilter("active");
    setEventoSearch(""); setEventoStatusFilter("all");
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
      if (ApiError.isUnauthorized(err)) { logout(); router.replace("/login"); return; }
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
    apiFetch<DetailedCierreCajaResponse[]>("/api/cierre", {}, session.token)
      .then(setCierres)
      .finally(() => setLoadingCierres(false));
    apiFetch<FacturaProveedorResponse[]>("/api/facturas-proveedor/mis-facturas", {}, session.token)
      .then(setFacturas)
      .finally(() => setLoadingFacturas(false));
    apiFetch<ProveedorResponse[]>("/api/proveedores", {}, session.token).then(setProveedores);
    apiFetch<ComedorResponse[]>("/api/comedor", {}, session.token).then(setComedores);
    apiFetch<PuntoDeVentaResponse[]>("/api/puntodeventa", {}, session.token).then(setPuntosDeVenta);
    apiFetch<EventoResponse[]>("/api/eventos/mis-cierres", {}, session.token)
      .then(setEventos)
      .catch(() => setEventos([]))
      .finally(() => setLoadingEventos(false));
  }, [session]);

  const handleNuevaFactura = async (req: CreateFacturaProveedorRequest) => {
    if (!session) return;
    try {
      const nueva = await apiFetch<FacturaProveedorResponse>(
        "/api/facturas-proveedor",
        { method: "POST", body: JSON.stringify(req) },
        session.token,
      );
      setFacturas((prev) => [nueva, ...prev]);
      toast({ title: "Factura creada", description: `Factura #${nueva.numero} creada correctamente.` });
    } catch (err) {
      if (ApiError.isUnauthorized(err)) { logout(); router.replace("/login"); return; }
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof ApiError ? err.message : "No se pudo crear la factura.",
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
                {view === "cierres" ? "Tus Cierres" : view === "compras" ? "Tus Compras" : "Tus Eventos"}
              </CardTitle>
              <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
                {(["cierres", "compras", "eventos"] as View[]).map((v) => (
                  <button key={v} onClick={() => setView(v)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                      view === v ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700",
                    )}>
                    {v === "cierres" ? "Cierres" : v === "compras" ? "Compras" : "Eventos"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <Input type="date" value={dateDesde} onChange={(e) => setDateDesde(e.target.value)}
                  className="h-8 w-36 text-sm bg-gray-50 border-gray-200" />
                <span className="text-xs text-gray-400">—</span>
                <Input type="date" value={dateHasta} onChange={(e) => setDateHasta(e.target.value)}
                  className="h-8 w-36 text-sm bg-gray-50 border-gray-200" />
              </div>
              {comedorOptions.length > 1 && (
                <select value={comedorFilter} onChange={(e) => setComedorFilter(e.target.value)}
                  className="h-8 rounded-md border border-gray-200 bg-gray-50 px-2 text-sm text-gray-600">
                  <option value="">Todos los comedores</option>
                  {comedorOptions.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
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
                proveedores={proveedores}
                loading={loadingFacturas}
                readonly
                dateDesde={dateDesde}
                dateHasta={dateHasta}
                comedorIdFilter={comedorIdFilter}
                onNuevaFactura={() => setNuevaFacturaOpen(true)}
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
          apiFetch<DetailedCierreCajaResponse[]>("/api/cierre", {}, session!.token).then(setCierres);
        }}
      />

      <NuevoEventoModal
        open={nuevoEventoOpen}
        onClose={() => setNuevoEventoOpen(false)}
        comedores={comedores}
        onConfirm={handleNuevoEvento}
      />
    </div>
  );
}
