
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
import { Download, FileSpreadsheet, Truck } from "lucide-react";

type View = "cierres" | "compras";
type PageResponse<T> = { content: T[] };

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

export default function ContabilidadPage() {
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
  const [nuevaFacturaOpen, setNuevaFacturaOpen] = useState(false);
  const [emitirFactura, setEmitirFactura] = useState<FacturaProveedorResponse | null>(null);
  const [pagarFactura, setPagarFactura] = useState<FacturaProveedorResponse | null>(null);
  const [editarFactura, setEditarFactura] = useState<FacturaProveedorResponse | null>(null);
  const [anularFactura, setAnularFactura] = useState<FacturaProveedorResponse | null>(null);
  const [facturaSearch, setFacturaSearch] = useState("");
  const [facturaStatusFilter, setFacturaStatusFilter] = useState<FacturaStatusFilter>("all");
  const [facturaSortKey, setFacturaSortKey] = useState<FacturaSortKey>("fechaFactura");
  const [facturaSortDir, setFacturaSortDir] = useState<FacturaSortDir>("desc");

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

  const montoVentas = useMemo(() => {
    let list = cierres.filter((c) => c.anulacionId === null);
    if (dateDesde) list = list.filter((c) => c.fechaOperacion >= dateDesde);
    if (dateHasta) list = list.filter((c) => c.fechaOperacion <= dateHasta);
    if (comedorFilter) list = list.filter((c) => c.comedor.nombre === comedorFilter);
    return list.reduce((s, c) => s + c.montoTotal, 0);
  }, [cierres, dateDesde, dateHasta, comedorFilter]);

  const ventasBanco = useMemo(() => {
    if (!montoVentas) return 0;
    return montoVentas / 0.72 - montoVentas;
  }, [montoVentas]);

  const montoCompras = useMemo(() => {
    let list = facturas.filter((f) => f.estado !== "ANULADA");
    if (dateDesde) list = list.filter((f) => f.fechaFactura >= dateDesde);
    if (dateHasta) list = list.filter((f) => f.fechaFactura <= dateHasta);
    if (comedorIdFilter !== null) list = list.filter((f) => f.comedorId === comedorIdFilter);
    return list.reduce((s, f) => s + f.monto, 0);
  }, [facturas, dateDesde, dateHasta, comedorIdFilter]);

  const balance = montoVentas - montoCompras;

  const displayedFacturas = useMemo(() => {
    let list = [...facturas];
    if (dateDesde) list = list.filter((factura) => factura.fechaFactura >= dateDesde);
    if (dateHasta) list = list.filter((factura) => factura.fechaFactura <= dateHasta);
    if (comedorIdFilter !== null) list = list.filter((factura) => factura.comedorId === comedorIdFilter);
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
    proveedorNameById,
  ]);

  const clearFilters = () => {
    setDateDesde(""); setDateHasta(""); setComedorFilter("");
    setSearch(""); setStatusFilter("active");
    setFacturaSearch(""); setFacturaStatusFilter("all");
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
          buildDateRangePart(dateDesde, dateHasta),
          statusFilter !== "active" ? (statusFilter === "all" ? "todos" : "anulados") : null,
          buildSearchPart(search),
        ]),
      );
      return;
    }

    exportRowsToXlsx(
      displayedFacturas.map((factura) => ({
        "Fecha factura": factura.fechaFactura,
        Número: factura.numero,
        Proveedor: proveedorNameById[factura.proveedorId] ?? String(factura.proveedorId),
        Comedor: comedorNameById[factura.comedorId] ?? String(factura.comedorId),
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
        buildDateRangePart(dateDesde, dateHasta),
        facturaStatusFilter !== "all" ? EstadoFacturaLabel[facturaStatusFilter] : null,
        buildSearchPart(facturaSearch),
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
    apiFetch<DetailedCierreCajaResponse[]>("/api/cierre/detailed", {}, session.token)
      .then(setCierres)
      .finally(() => setLoadingCierres(false));
    apiFetch<PageResponse<FacturaProveedorResponse>>("/api/facturas-proveedor?size=10000", {}, session.token)
      .then((res) => setFacturas(res.content))
      .finally(() => setLoadingFacturas(false));
    apiFetch<ProveedorResponse[]>("/api/proveedores", {}, session.token).then(setProveedores);
    apiFetch<ComedorResponse[]>("/api/comedor", {}, session.token).then(setComedores);
    apiFetch<PuntoDeVentaResponse[]>("/api/puntodeventa", {}, session.token).then(setPuntosDeVenta);
  }, [session]);

  const handleError = (err: unknown) => {
    if (ApiError.isUnauthorized(err)) { logout(); router.replace("/login"); return; }
    toast({
      variant: "destructive",
      title: "Error",
      description: err instanceof ApiError ? err.message : "No se pudo completar la operación.",
    });
  };

  const handleAnularCierre = async (cierreId: number, motivo: string) => {
    if (!session) return;
    try {
      await apiFetch(`/api/cierre/${cierreId}/anular`,
        { method: "POST", body: JSON.stringify({ motivo }) }, session.token);
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
      const nueva = await apiFetch<FacturaProveedorResponse>("/api/facturas-proveedor",
        { method: "POST", body: JSON.stringify(req) }, session.token);
      setFacturas((prev) => [nueva, ...prev]);
      toast({ title: "Factura creada", description: `Factura #${nueva.numero} creada correctamente.` });
    } catch (err) { handleError(err); throw err; }
  };

  const handleEmitir = async (facturaId: number, fechaEmision: string, fechaPago: string | null) => {
    if (!session) return;
    try {
      const updated = await apiFetch<FacturaProveedorResponse>(`/api/facturas-proveedor/${facturaId}/emitir`,
        { method: "PATCH", body: JSON.stringify({ fechaEmision, fechaPago }) }, session.token);
      setFacturas((prev) => prev.map((f) => f.id === facturaId ? updated : f));
      toast({ title: "Factura emitida" });
    } catch (err) { handleError(err); throw err; }
  };

  const handlePagar = async (facturaId: number, fechaPago: string | null) => {
    if (!session) return;
    try {
      const updated = await apiFetch<FacturaProveedorResponse>(`/api/facturas-proveedor/${facturaId}/pagar`,
        { method: "PATCH", body: JSON.stringify({ fechaPago }) }, session.token);
      setFacturas((prev) => prev.map((f) => f.id === facturaId ? updated : f));
      toast({ title: "Pago registrado" });
    } catch (err) { handleError(err); throw err; }
  };

  const handleEditar = async (facturaId: number, req: PatchFacturaProveedorRequest) => {
    if (!session) return;
    try {
      const updated = await apiFetch<FacturaProveedorResponse>(`/api/facturas-proveedor/${facturaId}/editar`,
        { method: "PATCH", body: JSON.stringify(req) }, session.token);
      setFacturas((prev) => prev.map((f) => f.id === facturaId ? updated : f));
      toast({ title: "Factura actualizada" });
    } catch (err) { handleError(err); throw err; }
  };

  const handleAnularFactura = async (facturaId: number, motivo: string) => {
    if (!session) return;
    try {
      const updated = await apiFetch<FacturaProveedorResponse>(`/api/facturas-proveedor/${facturaId}/anular`,
        { method: "PATCH", body: JSON.stringify({ motivo }) }, session.token);
      setFacturas((prev) => prev.map((f) => f.id === facturaId ? updated : f));
      toast({ title: "Factura anulada" });
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

        {!loadingCierres && !loadingFacturas && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl bg-white shadow-sm px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Monto Ventas</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-600">{formatCurrency(montoVentas)}</p>
            </div>
            {/* <div className="rounded-xl bg-white shadow-sm px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Ventas Banco</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-sky-600">{formatCurrency(ventasBanco)}</p>
            </div> */}
            <div className="rounded-xl bg-white shadow-sm px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Monto Compras</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-red-500">{formatCurrency(montoCompras)}</p>
            </div>
            <div className="rounded-xl bg-white shadow-sm px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Balance</p>
              <p className={cn("mt-1 text-2xl font-bold tabular-nums", balance >= 0 ? "text-gray-800" : "text-red-600")}>
                {formatCurrency(balance)}
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-start gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/proveedores")}
            className="gap-2 border-gray-200 text-sm font-semibold"
          >
            <Truck className="h-4 w-4" />
            Proveedores
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
                  {(["cierres", "compras"] as View[]).map((v) => (
                    <button key={v} onClick={() => setView(v)}
                      className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                        view === v ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                      )}>
                      {v === "cierres" ? "Cierres" : "Compras"}
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
                      : loadingFacturas || displayedFacturas.length === 0
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
                <Input type="date" value={dateDesde} onChange={(e) => setDateDesde(e.target.value)}
                  className="h-8 w-36 text-sm bg-gray-50 border-gray-200" />
                <span className="text-xs text-gray-400">—</span>
                <Input type="date" value={dateHasta} onChange={(e) => setDateHasta(e.target.value)}
                  className="h-8 w-36 text-sm bg-gray-50 border-gray-200" />
              </div>
              <select value={comedorFilter} onChange={(e) => setComedorFilter(e.target.value)}
                className="h-8 min-w-48 rounded-md border border-gray-200 bg-gray-50 px-2 text-sm text-gray-600">
                <option value="">Todos los comedores</option>
                {comedorOptions.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
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
                onClearFilters={clearFilters}
              />
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
            apiFetch<DetailedCierreCajaResponse[]>("/api/cierre/detailed", {}, session!.token).then(setCierres);
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
    </div>
  );
}
