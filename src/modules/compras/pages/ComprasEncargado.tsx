import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi } from "@/hooks/useApi";
import { cn, fmtCurrency } from "@/lib/utils";
import { StatCard } from "@/modules/cierres/components/CierreStat";
import { ArrowLeft, Ban, ChevronDown, ChevronUp, Download, MoreHorizontal, Pencil, Plus } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable, SortableTh } from "@/components/data-table";
import { FacturasStatusFilter } from "../components/filters/FacturasStatusFilter";
import { useTableState } from "@/hooks/useTableState";
import type { FacturaProveedorResponse } from "@/domain/dto/compra/FacturaProveedorResponse";
import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { KpiCard } from "@/components/KpiCard";
import { OrdenesDeCompraTable } from "../components/OrdenesDeCompraTable";
import { downloadPdf } from "@/lib/download";
import { exportToXlsx, type ExportColumn } from "@/lib/exportXlsx";
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

const ESTADO_STYLES: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  ANULADA: { label: "Anulada", bg: "bg-red-100", text: "text-red-600" },
  EMITIDA: { label: "Emitida", bg: "bg-blue-100", text: "text-blue-700" },
  PAGADA: { label: "Pagada", bg: "bg-emerald-100", text: "text-emerald-700" },
  PENDIENTE: { label: "Pendiente", bg: "bg-amber-100", text: "text-amber-700" },
};

export default function ComprasEncargado() {
  const navigate = useNavigate();
  const { get, patch, del } = useApi();

  const [facturas, setFacturas] = useState<FacturaProveedorResponse[]>([]);
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [proveedores, setProveedores] = useState<{ id: number; nombre: string; taxId: string }[]>([]);

  const [ordenes, setOrdenes] = useState<OrdenDeCompraResponse[]>([]);
  const [anularFactura, setAnularFactura] =
    useState<FacturaProveedorResponse | null>(null);

  useEffect(() => {
    Promise.all([get("/facturas/proveedor/mis-facturas"), get("/comedores"), get("/proveedores")]).then(
      ([facturasRes, comedoresRes, proveedoresRes]) => {
        facturasRes.json().then((data) => setFacturas(Array.isArray(data) ? data : []));
        comedoresRes.json().then(setComedores);
        proveedoresRes.json().then(setProveedores);
      },
    );
  }, [get]);

  useEffect(() => {
    get("/ordenes-de-compra/mis-ordenes")
      .then((r) => r.json())
      .then((data: OrdenDeCompraResponse[]) => setOrdenes(Array.isArray(data) ? data : []));
  }, [get]);

  const handleDownloadPdf = async (o: OrdenDeCompraResponse) => {
    try {
      await downloadPdf(get, `/ordenes-de-compra/${o.id}/pdf`, `orden-${o.nroOrden}.pdf`);
    } catch {
      toast.error("No se pudo descargar el PDF");
    }
  };

  const handleCancelarOrden = async (o: OrdenDeCompraResponse) => {
    try {
      const updated: OrdenDeCompraResponse = await patch(
        `/ordenes-de-compra/${o.id}/cancelar`,
        {},
      ).then((r) => r.json());
      setOrdenes((prev) => prev.map((x) => (x.id === o.id ? updated : x)));
      toast("Orden cancelada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cancelar la orden");
    }
  };

  const handleAnularFactura = async (facturaId: number, motivo: string) => {
    try {
      const updated = await del(`/facturas/proveedor/${facturaId}`, {
        body: JSON.stringify({ motivo }),
      }).then((r) => r.json());
      setFacturas((prev) => prev.map((f) => (f.id === facturaId ? updated : f)));
      toast("Factura anulada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo anular la factura");
      throw err;
    }
  };

  const proveedorNameById = useMemo(
    () => Object.fromEntries(proveedores.map((p) => [p.id, p.nombre])),
    [proveedores],
  );

  const proveedorTaxById = useMemo(
    () => Object.fromEntries(proveedores.map((p) => [p.id, p.taxId])),
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

  const { displayed, sort, expansion, filters } = useTableState(facturas, {
    searchFields: (f) => [
      f.numero,
      f.comentarios || "",
      f.numeroOperacion || "",
    ],
    statusField: "estado",
    statusMapping: {
      PENDIENTE: { filter: (f) => f.estado === "PENDIENTE" },
      EMITIDA: { filter: (f) => f.estado === "EMITIDA" },
      PAGADA: { filter: (f) => f.estado === "PAGADA" },
      ANULADA: { filter: (f) => f.estado === "ANULADA" },
    },
    defaultSortKey: "fechaFactura" as const,
  });

  const sortProps = { sortKey: sort.key, sortDir: sort.dir, onSort: sort.handleSort };

  const totalActivos = facturas.filter((f) => f.estado !== "ANULADA").length;
  const totalAnulados = facturas.filter((f) => f.estado === "ANULADA").length;
  const montoTotal = facturas
    .filter((f) => f.estado !== "ANULADA")
    .reduce((s, f) => s + (f.monto ?? 0), 0);
  const montoFiltrado = displayed.reduce((s, f) => s + (f.monto ?? 0), 0);
  const isFiltered = displayed.length !== facturas.length;

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
    { key: (f) => proveedorTaxById[f.proveedorId] ?? "", header: "CUIT" },
    { key: (f) => comedorNameById[f.comedorId] ?? f.comedorId, header: "Comedor" },
    { key: "fechaFactura", header: "Fecha Factura" },
    { key: "monto", header: "Monto" },
    { key: "estado", header: "Estado" },
    { key: "medioPago", header: "Medio de Pago" },
    { key: "fechaEmision", header: "Fecha Emisión" },
    { key: "fechaPago", header: "Fecha Pago" },
    { key: "numeroOperacion", header: "Nº Operación" },
    { key: "bancoNombre", header: "Banco" },
    { key: "comentarios", header: "Comentarios" },
    { key: (f) => (f.puntoDeVentaComedor ?? []).map((s) => `${posNameById[s.puntoDeVentaId] ?? `Punto de venta #${s.puntoDeVentaId}`}: $${s.monto}`).join(", "), header: "Puntos de Venta" },
    { key: "creadoPorNombre", header: "Creado por" },
  ];

  const handleExport = () => {
    const segments = ["mis-compras"];
    if (filters.status !== "all") segments.push(filters.status);
    exportToXlsx({ data: displayed, columns: exportColumns, filename: segments.join("-") });
  };

  return (
    <div className="px-4 sm:px-8 lg:px-18 py-8">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/encargado")}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>

      <div className="mx-auto max-w-7xl grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 pb-4">
        <StatCard label="Total facturas" value={facturas.length} />
        <StatCard label="Activas" value={totalActivos} accent="emerald" />
        <StatCard label="Anuladas" value={totalAnulados} accent="red" />
        <StatCard label="Monto total" value={fmtCurrency(montoTotal)} />
        <StatCard
          label={isFiltered ? "Monto filtrado" : "Monto activo"}
          value={fmtCurrency(isFiltered ? montoFiltrado : montoTotal)}
          accent={isFiltered ? "blue" : undefined}
        />
        <KpiCard
          title="Monto estimado OC"
          endpoint="/analytics/encargado/ordenes-compra/monto-estimado"
          format="currency"
          valueExtractor={(d) =>
            typeof d === "number" ? d : ((d as { total?: number })?.total ?? 0)
          }
        />
      </div>

      <Tabs defaultValue="facturas" className="mx-auto max-w-7xl">
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
        </CardHeader>
        <CardContent className="p-0">
           <DataTable
             displayedCount={displayed.length}
             toolbarLeft={
               <div className="flex flex-wrap items-center gap-2">
                 <div className="relative">
                   <input
                     type="text"
                     value={filters.search}
                     onChange={(e) => filters.setSearch(e.target.value)}
                     placeholder="Buscar..."
                     className="h-8 w-52 pl-8 pr-8 text-sm bg-gray-50 border border-gray-200 rounded-md"
                   />
                 </div>
                 <FacturasStatusFilter
                   value={filters.status as "all" | "PENDIENTE" | "EMITIDA" | "PAGADA" | "ANULADA"}
                   onChange={filters.setStatus}
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
                 {displayed.map((factura) => {
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
