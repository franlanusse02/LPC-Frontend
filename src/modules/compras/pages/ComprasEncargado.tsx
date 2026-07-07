import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi } from "@/hooks/useApi";
import { cn, fmtCurrency } from "@/lib/utils";
import { StatCard } from "@/modules/cierres/components/CierreStat";
import { ArrowLeft, Ban, ChevronDown, ChevronUp, Download, MoreHorizontal, Pencil, Plus } from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable, SortableTh } from "@/components/data-table";
import { Pagination } from "@/components/Pagination";
import { useExpandableRows } from "@/hooks/useExpandableRows";
import { FacturasStatusFilter } from "../components/filters/FacturasStatusFilter";
import type { FacturaProveedorResponse } from "@/domain/dto/compra/FacturaProveedorResponse";
import type { FacturaProveedorStatsResponse } from "@/domain/dto/compra/FacturaProveedorStatsResponse";
import type { OrdenDeCompraStatsResponse } from "@/domain/dto/orden-compra/OrdenDeCompraStatsResponse";
import type { Page } from "@/domain/dto/shared/Page";
import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { KpiCard } from "@/components/KpiCard";
import { OrdenesDeCompraTable } from "../components/OrdenesDeCompraTable";
import { downloadPdf } from "@/lib/download";
import { exportToXlsx, type ExportColumn } from "@/lib/exportXlsx";
import {
  ListFilters,
  type ListFilterState,
} from "@/components/ListFilters";
import { defaultFilters } from "@/components/list-filter-defaults";
import { toast } from "sonner";
import type { OrdenDeCompraResponse } from "@/domain/dto/orden-compra/OrdenDeCompraResponse";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AnularFacturaModal } from "../components/AnularFacturaModal";
import { buildQuery } from "@/lib/query-string";

const ESTADO_STYLES: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  ANULADA: { label: "Anulada", bg: "bg-red-100", text: "text-red-600" },
  EMITIDA: { label: "Emitida", bg: "bg-blue-100", text: "text-blue-700" },
  PAGADA: { label: "Pagada", bg: "bg-emerald-100", text: "text-emerald-700" },
  PENDIENTE: { label: "Pendiente", bg: "bg-amber-100", text: "text-amber-700" },
};

type StatusFilter = "all" | "PENDIENTE" | "EMITIDA" | "PAGADA" | "ANULADA";

const SORT_KEY_TO_ENTITY: Record<string, string> = {
  numero: "numeroFactura",
};

export default function ComprasEncargado() {
  const navigate = useNavigate();
  const { get, patch, del } = useApi();

  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [proveedores, setProveedores] = useState<{ id: number; nombre: string; taxId: string }[]>([]);
  const [activeTab, setActiveTab] = useState<"facturas" | "ordenes">("facturas");

  const [anularFactura, setAnularFactura] =
    useState<FacturaProveedorResponse | null>(null);

  const [listFilters, setListFiltersRaw] = useState<ListFilterState>(defaultFilters);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [sortKey, setSortKey] = useState("fechaFactura");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [pageData, setPageData] = useState<Page<FacturaProveedorResponse> | null>(null);
  const [stats, setStats] = useState<FacturaProveedorStatsResponse | null>(null);

  const facturas = pageData?.content ?? [];

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const [ordenPageData, setOrdenPageData] = useState<Page<OrdenDeCompraResponse> | null>(null);
  const [ordenStats, setOrdenStats] = useState<OrdenDeCompraStatsResponse | null>(null);
  const [ordenStatusFilter, setOrdenStatusFilter] = useState<"all" | "PENDIENTE" | "APROBADA" | "ENVIADA" | "CANCELADA">("all");
  const [ordenSearchInput, setOrdenSearchInput] = useState("");
  const [ordenSearch, setOrdenSearch] = useState("");
  const [ordenPage, setOrdenPage] = useState(0);
  const [ordenSize, setOrdenSize] = useState(20);
  const [ordenSortKey, setOrdenSortKey] = useState("fecha");
  const [ordenSortDir, setOrdenSortDir] = useState<"asc" | "desc">("desc");

  const ordenes = ordenPageData?.content ?? [];

  useEffect(() => {
    const t = setTimeout(() => {
      setOrdenSearch(ordenSearchInput);
      setOrdenPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [ordenSearchInput]);

  const handleOrdenStatusChange = (next: "all" | "PENDIENTE" | "APROBADA" | "ENVIADA" | "CANCELADA") => {
    setOrdenStatusFilter(next);
    setOrdenPage(0);
  };

  const handleOrdenSizeChange = (next: number) => {
    setOrdenSize(next);
    setOrdenPage(0);
  };

  const handleOrdenSort = (key: string) => {
    if (key === ordenSortKey) setOrdenSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setOrdenSortKey(key);
      setOrdenSortDir("asc");
    }
    setOrdenPage(0);
  };

  const fetchOrdenes = useCallback(() => {
    const qs = buildQuery({
      search: ordenSearch || undefined,
      estado: ordenStatusFilter === "all" ? undefined : ordenStatusFilter,
      page: ordenPage,
      size: ordenSize,
      sort: `${ordenSortKey},${ordenSortDir}`,
    });
    return get(`/ordenes-de-compra/mis-ordenes${qs}`).then((r) => r.json()).then(setOrdenPageData);
  }, [get, ordenSearch, ordenStatusFilter, ordenPage, ordenSize, ordenSortKey, ordenSortDir]);

  const fetchOrdenStats = useCallback(() => {
    const qs = buildQuery({ search: ordenSearch || undefined });
    return get(`/ordenes-de-compra/mis-ordenes/stats${qs}`).then((r) => r.json()).then(setOrdenStats);
  }, [get, ordenSearch]);

  useEffect(() => {
    fetchOrdenes();
  }, [fetchOrdenes]);

  useEffect(() => {
    fetchOrdenStats();
  }, [fetchOrdenStats]);

  useEffect(() => {
    get("/comedores").then((r) => r.json()).then(setComedores);
  }, [get]);

  useEffect(() => {
    get("/proveedores").then((r) => r.json()).then(setProveedores);
  }, [get]);

  const handleFiltersChange = (next: ListFilterState) => {
    setListFiltersRaw(next);
    setPage(0);
  };

  const handleStatusChange = (next: StatusFilter) => {
    setStatusFilter(next);
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
      fechaInicio: listFilters.desde,
      fechaFin: listFilters.hasta,
      search: search || undefined,
      estado: statusFilter === "all" ? undefined : statusFilter,
      page,
      size,
      sort: `${SORT_KEY_TO_ENTITY[sortKey] ?? sortKey},${sortDir}`,
    });
    return get(`/facturas/proveedor/mis-facturas${qs}`).then((r) => r.json()).then(setPageData);
  }, [get, listFilters.desde, listFilters.hasta, search, statusFilter, page, size, sortKey, sortDir]);

  const fetchStats = useCallback(() => {
    const qs = buildQuery({
      fechaInicio: listFilters.desde,
      fechaFin: listFilters.hasta,
      search: search || undefined,
    });
    return get(`/facturas/proveedor/mis-facturas/stats${qs}`).then((r) => r.json()).then(setStats);
  }, [get, listFilters.desde, listFilters.hasta, search]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleDownloadPdf = async (o: OrdenDeCompraResponse) => {
    try {
      await downloadPdf(get, `/ordenes-de-compra/${o.id}/pdf`, `orden-${o.nroOrden}.pdf`);
    } catch {
      toast.error("No se pudo descargar el PDF");
    }
  };

  const handleCancelarOrden = async (o: OrdenDeCompraResponse) => {
    try {
      await patch(`/ordenes-de-compra/${o.id}/cancelar`, {});
      toast("Orden cancelada");
      fetchOrdenes();
      fetchOrdenStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cancelar la orden");
    }
  };

  const handleAnularFactura = async (facturaId: number, motivo: string) => {
    try {
      await del(`/facturas/proveedor/${facturaId}`, {
        body: JSON.stringify({ motivo }),
      });
      toast("Factura anulada");
      fetchList();
      fetchStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo anular la factura");
      throw err;
    }
  };

  const proveedorNameById = useMemo(
    () => Object.fromEntries(proveedores.map((p) => [p.id, p.nombre])),
    [proveedores],
  );

  const comedorNameById = useMemo(
    () => Object.fromEntries(comedores.map((c) => [c.id, c.nombre])),
    [comedores],
  );

  const posNameById = useMemo(() => {
    const map: Record<number, string> = {};
    for (const c of comedores) {
      for (const pv of c.puntosDeVenta ?? []) {
        map[pv.id] = pv.nombre;
      }
    }
    return map;
  }, [comedores]);

  const sortProps = { sortKey, sortDir, onSort: handleSort };

  const expansion = useExpandableRows();

  const analyticsFilters = useMemo(
    () => ({
      fechaInicio: listFilters.desde || undefined,
      fechaFin: listFilters.hasta || undefined,
    }),
    [listFilters],
  );

  const exportColumns: ExportColumn<FacturaProveedorResponse>[] = [
    { key: (f) => new Date(f.creadoEn).toLocaleString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit",
      hour12: false,
    }), header: "Fecha de Carga" },
    { key: "id", header: "ID" },
    { key: "numero", header: "Nº Factura" },
    { key: (f) => proveedorNameById[f.proveedorId] ?? f.proveedorId, header: "Proveedor" },
    { key: (f) => comedorNameById[f.comedorId] ?? f.comedorId, header: "Comedor" },
    { key: "fechaFactura", header: "Fecha Factura" },
    { key: "monto", header: "Monto" },
    { key: "estado", header: "Estado" },
    { key: "medioPago", header: "Medio de Pago" },
    { key: "numeroOperacion", header: "Nº Operación" },
    { key: "comentarios", header: "Comentarios" },
    { key: (f) => (f.puntoDeVentaComedor ?? []).map((s) => `${posNameById[s.puntoDeVentaId] ?? `Punto de venta #${s.puntoDeVentaId}`}: $${s.monto}`).join(", "), header: "Puntos de Venta" },
  ];

  const handleExport = () => {
    const segments = ["mis-compras"];
    if (statusFilter !== "all") segments.push(statusFilter);
    exportToXlsx({ data: facturas, columns: exportColumns, filename: segments.join("-") });
  };

  const isFiltered = !!stats && stats.montoTotalActivo !== stats.montoFiltradoActivo;

  return (
    <div className="px-4 sm:px-8 lg:px-18 py-8">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/encargado")}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>

      {activeTab === "facturas" ? (
        <div className="mx-auto max-w-7xl grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 pb-4">
          <StatCard label="Total facturas" value={stats?.total ?? 0} />
          <StatCard label="Activas" value={(stats?.total ?? 0) - (stats?.anuladas ?? 0)} accent="emerald" />
          <StatCard label="Anuladas" value={stats?.anuladas ?? 0} accent="red" />
          <StatCard label="Monto total" value={fmtCurrency(stats?.montoTotalActivo ?? 0)} />
          <StatCard
            label={isFiltered ? "Monto filtrado" : "Monto activo"}
            value={fmtCurrency(stats?.montoFiltradoActivo ?? 0)}
            accent={isFiltered ? "blue" : undefined}
          />
          <KpiCard
            title="Monto estimado OC"
            endpoint="/analytics/encargado/ordenes-compra/monto-estimado"
            filters={analyticsFilters}
            format="currency"
            valueExtractor={(d) =>
              typeof d === "number" ? d : ((d as { total?: number })?.total ?? 0)
            }
          />
        </div>
      ) : (
        <div className="mx-auto max-w-7xl grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 pb-4">
          <StatCard label="Total órdenes" value={ordenStats?.total ?? 0} />
          <StatCard label="Pendientes" value={ordenStats?.pendientes ?? 0} accent="blue" />
          <StatCard label="Enviadas" value={ordenStats?.enviadas ?? 0} accent="emerald" />
          <StatCard label="Canceladas" value={ordenStats?.canceladas ?? 0} accent="red" />
          <StatCard label="Monto total" value={fmtCurrency(ordenStats?.montoTotalActivo ?? 0)} />
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "facturas" | "ordenes")} className="mx-auto max-w-7xl">
        <TabsList className="mb-4 px-1">
          <TabsTrigger value="facturas">Facturas</TabsTrigger>
          <TabsTrigger value="ordenes">Órdenes de Compra</TabsTrigger>
        </TabsList>

        <TabsContent value="ordenes">
          <Card className="py-6 border-0 shadow-md rounded-xl">
            <CardHeader className="border-b px-6 py-4">
              <div className="w-full flex flex-row justify-between">
                <CardTitle className="text-xl font-bold text-gray-800">
                  Tus Órdenes de Compra
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => navigate("/encargado/compras/ordenes/nueva")}
                  className="gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-wide hover:scale-105 transition"
                >
                  <Plus className="h-4 w-4" /> Nueva Orden
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <OrdenesDeCompraTable
                ordenes={ordenes}
                onDownloadPdf={handleDownloadPdf}
                onEdit={(o) => navigate(`/encargado/compras/ordenes/${o.id}/editar`)}
                onCancelar={handleCancelarOrden}
                sortKey={ordenSortKey}
                sortDir={ordenSortDir}
                onSort={handleOrdenSort}
                search={ordenSearchInput}
                onSearchChange={setOrdenSearchInput}
                status={ordenStatusFilter}
                onStatusChange={handleOrdenStatusChange}
                page={ordenPageData?.number ?? 0}
                size={ordenPageData?.size ?? ordenSize}
                totalPages={ordenPageData?.totalPages ?? 0}
                totalElements={ordenPageData?.totalElements ?? 0}
                onPageChange={setOrdenPage}
                onSizeChange={handleOrdenSizeChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="facturas">
      <Card className="py-6 border-0 shadow-md rounded-xl">
        <CardHeader className="border-b px-6 py-4">
          <div className="w-full flex flex-row justify-between">
            <CardTitle className="text-xl font-bold text-gray-800">
              Tus Facturas
            </CardTitle>
            <Button
              size="sm"
              onClick={() => navigate("/encargado/compras/facturas/nueva")}
              className="gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-wide hover:scale-105 transition"
            >
              <Plus className="h-4 w-4" /> Nueva Factura
            </Button>
          </div>
          <div className="pt-3">
            <ListFilters
              filters={listFilters}
              onChange={handleFiltersChange}
              comedores={comedores}
              showSociedad={false}
              showComedor={false}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
           <DataTable
             displayedCount={pageData?.numberOfElements ?? 0}
             toolbarLeft={
               <div className="flex flex-wrap items-center gap-2">
                 <div className="relative">
                   <input
                     type="text"
                     value={searchInput}
                     onChange={(e) => setSearchInput(e.target.value)}
                     placeholder="Buscar..."
                     className="h-8 w-52 pl-8 pr-8 text-sm bg-gray-50 border border-gray-200 rounded-md"
                   />
                 </div>
                 <FacturasStatusFilter
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
                <SortableTh label="N° Factura" col="numero" {...sortProps} />
                <SortableTh label="Fecha" col="fechaFactura" {...sortProps} />
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3">Comedor</th>
                <SortableTh
                  label="Monto"
                  col="monto"
                  {...sortProps}
                  className="text-right"
                />
                <SortableTh label="Estado" col="estado" {...sortProps} />
                <th className="px-4 py-3">Medio de Pago</th>
                <th className="px-4 py-3">Comentarios</th>
                <th className="px-4 py-3 w-12" />
              </>
            }
             rows={
               <>
                 {facturas.map((factura) => {
                   const isExpanded = expansion.expandedRows.has(factura.id);
                   const isAnulada = factura.estado === "ANULADA";
                   const styles = ESTADO_STYLES[factura.estado];
                   const posSplits = factura.puntoDeVentaComedor ?? [];

                   return (
                     <Fragment key={factura.id}>
                       <tr
                         className={cn(
                           "border-b transition-colors",
                           isAnulada
                             ? "bg-red-50/30 text-gray-400"
                             : "hover:bg-gray-50/80",
                         )}
                       >
                         <td
                           className="px-4 py-4 cursor-pointer text-gray-400 hover:text-gray-600"
                           onClick={() => expansion.toggleRow(factura.id)}
                         >
                           {isExpanded ? (
                             <ChevronUp className="h-4 w-4" />
                           ) : (
                             <ChevronDown className="h-4 w-4" />
                           )}
                         </td>
                         <td
                           className="px-4 py-4 font-medium whitespace-nowrap cursor-pointer"
                           onClick={() => expansion.toggleRow(factura.id)}
                         >
                           {factura.numero}
                         </td>
                         <td
                           className="px-4 py-4 whitespace-nowrap cursor-pointer"
                           onClick={() => expansion.toggleRow(factura.id)}
                         >
                           {factura.fechaFactura}
                         </td>
                         <td
                           className="px-4 py-4 cursor-pointer"
                           onClick={() => expansion.toggleRow(factura.id)}
                         >
                           {proveedorNameById[factura.proveedorId] ?? factura.proveedorId}
                         </td>
                         <td
                           className="px-4 py-4 cursor-pointer"
                           onClick={() => expansion.toggleRow(factura.id)}
                         >
                           {comedorNameById[factura.comedorId] ?? factura.comedorId}
                         </td>
                         <td
                           className="px-4 py-4 text-right font-mono cursor-pointer"
                           onClick={() => expansion.toggleRow(factura.id)}
                         >
                           {fmtCurrency(factura.monto)}
                         </td>
                         <td
                           className="px-4 py-4 cursor-pointer"
                           onClick={() => expansion.toggleRow(factura.id)}
                         >
                           <span
                             className={cn(
                               "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                               styles.bg,
                               styles.text,
                             )}
                           >
                             {isAnulada && <Ban className="h-3 w-3" />}
                             {styles.label}
                           </span>
                         </td>
                         <td
                           className="px-4 py-4 cursor-pointer"
                           onClick={() => expansion.toggleRow(factura.id)}
                         >
                           {factura.medioPago || (
                             <span className="text-gray-300">—</span>
                           )}
                         </td>
                         <td
                           className="px-4 py-4 text-gray-500 cursor-pointer max-w-[160px] truncate"
                           onClick={() => expansion.toggleRow(factura.id)}
                         >
                           {factura.comentarios || (
                             <span className="text-gray-300">—</span>
                           )}
                         </td>
                         <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                           {factura.estado === "PENDIENTE" && (
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
                                   onClick={() => navigate(`/encargado/compras/${factura.id}/editar`)}
                                   className="gap-2.5 cursor-pointer rounded-lg text-gray-700 focus:text-gray-900"
                                 >
                                   <Pencil className="h-4 w-4 text-gray-400" /> Editar
                                 </DropdownMenuItem>
                                 <DropdownMenuSeparator className="my-1" />
                                 <DropdownMenuItem
                                   onClick={() => setAnularFactura(factura)}
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
                           <td colSpan={10} className="px-8 py-4">
                             <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                               <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 lg:grid-cols-4 p-4">
                                 {factura.numeroOperacion && (
                                   <div className="flex flex-col gap-0.5">
                                     <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Nº Operación</span>
                                     <span className="text-sm text-gray-700">{factura.numeroOperacion}</span>
                                   </div>
                                 )}
                                 {factura.bancoNombre && (
                                   <div className="flex flex-col gap-0.5">
                                     <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Banco</span>
                                     <span className="text-sm text-gray-700">{factura.bancoNombre}</span>
                                   </div>
                                 )}
                                 {factura.medioPago && (
                                   <div className="flex flex-col gap-0.5">
                                     <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Medio de Pago</span>
                                     <span className="text-sm text-gray-700">{factura.medioPago}</span>
                                   </div>
                                 )}
                                 {factura.comentarios && (
                                   <div className="flex flex-col gap-0.5">
                                     <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Comentarios</span>
                                     <span className="text-sm text-gray-700">{factura.comentarios}</span>
                                   </div>
                                 )}
                                 <div className="flex flex-col gap-0.5">
                                   <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Fecha de Carga</span>
                                   <span className="text-sm text-gray-700">
                                     {new Date(factura.creadoEn).toLocaleString("es-AR", {
                                       timeZone: "America/Argentina/Buenos_Aires",
                                       day: "2-digit", month: "2-digit", year: "2-digit",
                                       hour: "2-digit", minute: "2-digit",
                                       hour12: false,
                                     })}
                                   </span>
                                 </div>
                                 <div className="flex flex-col gap-0.5">
                                   <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Creado por</span>
                                   <span className="text-sm text-gray-700">{factura.creadoPorNombre}</span>
                                 </div>
                               </div>
                             </div>

                             {posSplits.length > 0 && (
                               <div className="mt-3 rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                 <table className="w-full text-sm">
                                   <thead>
                                     <tr className="bg-gray-100 text-left text-xs uppercase text-gray-500 tracking-wider">
                                       <th className="px-4 py-2.5">Punto de Venta</th>
                                       <th className="px-4 py-2.5 text-right">Monto</th>
                                     </tr>
                                   </thead>
                                   <tbody className="divide-y divide-gray-100">
                                     {posSplits.map((split) => (
                                       <tr key={split.puntoDeVentaId} className="hover:bg-white transition-colors">
                                         <td className="px-4 py-2.5 text-gray-700">
                                           {posNameById[split.puntoDeVentaId] ?? `Punto de venta #${split.puntoDeVentaId}`}
                                         </td>
                                         <td className="px-4 py-2.5 text-right font-mono text-gray-700">
                                           {fmtCurrency(split.monto)}
                                         </td>
                                       </tr>
                                     ))}
                                   </tbody>
                                 </table>
                               </div>
                             )}
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
        </TabsContent>
      </Tabs>
      <AnularFacturaModal
        open={!!anularFactura}
        onClose={() => setAnularFactura(null)}
        factura={anularFactura}
        onConfirm={handleAnularFactura}
      />
    </div>
  );
}
