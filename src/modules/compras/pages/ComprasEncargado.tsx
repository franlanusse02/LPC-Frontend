import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi } from "@/hooks/useApi";
import { cn, fmtCurrency } from "@/lib/utils";
import { ArrowLeft, Ban, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable, SortableTh } from "@/components/data-table";
import { FacturasStatusFilter } from "../components/filters/FacturasStatusFilter";
import { useTableState } from "@/hooks/useTableState";
import type { FacturaProveedorResponse } from "@/domain/dto/compra/FacturaProveedorResponse";

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
  const { get } = useApi();

  const [facturas, setFacturas] = useState<FacturaProveedorResponse[]>([]);

  useEffect(() => {
    get("/facturas/proveedor/mis-facturas")
      .then((r) => r.json())
      .then((data) => setFacturas(Array.isArray(data) ? data : []));
  }, [get]);

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

  return (
    <div className="px-18 py-8">
      <div className="max-w-2/3 mx-auto">
        <Button variant="ghost" onClick={() => navigate("/encargado")}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>
      <Card className="mx-auto max-w-2/3 py-6 border-0 shadow-md rounded-xl">
        <CardHeader className="border-b px-6 py-4">
          <div className="w-full flex flex-row justify-between">
            <CardTitle className="text-xl font-bold text-gray-800">
              Tus Facturas
            </CardTitle>
            <Button
              size="sm"
              onClick={() => navigate("/encargado/compras/nueva")}
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
              </>
            }
             rows={
               <>
                 {displayed.map((factura) => {
                   const isExpanded = expansion.expandedRows.has(factura.id);
                   const isAnulada = factura.estado === "ANULADA";
                   const styles = ESTADO_STYLES[factura.estado];

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
                           {factura.proveedorId}
                         </td>
                         <td
                           className="px-4 py-4 cursor-pointer"
                           onClick={() => expansion.toggleRow(factura.id)}
                         >
                           {factura.comedorId}
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
                       </tr>

                       {isExpanded && (
                         <tr className="bg-gray-50/60">
                           <td colSpan={9} className="px-8 py-4">
                             <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                               <table className="w-full text-sm">
                                 <thead>
                                   <tr className="bg-gray-100 text-left text-xs uppercase text-gray-500 tracking-wider">
                                     <th className="px-4 py-2.5">N° Factura</th>
                                     <th className="px-4 py-2.5">
                                       Fecha Factura
                                     </th>
                                     <th className="px-4 py-2.5">
                                       Fecha Emisi\u00f3n
                                     </th>
                                     <th className="px-4 py-2.5">Fecha Pago</th>
                                     <th className="px-4 py-2.5">
                                       N\u00ba Operaci\u00f3n
                                     </th>
                                     <th className="px-4 py-2.5 text-right">
                                       Monto
                                     </th>
                                     <th className="px-4 py-2.5">Banco</th>
                                     <th className="px-4 py-2.5">
                                       Medio de Pago
                                     </th>
                                   </tr>
                                 </thead>
                                 <tbody>
                                   <tr className="border-b last:border-b-0 hover:bg-white transition-colors">
                                     <td className="px-4 py-2.5 font-medium">
                                       {factura.numero}
                                     </td>
                                     <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                                       {factura.fechaFactura}
                                     </td>
                                     <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                                       {factura.fechaEmision || (
                                         <span className="text-gray-300">—</span>
                                       )}
                                     </td>
                                     <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                                       {factura.fechaPago || (
                                         <span className="text-gray-300">—</span>
                                       )}
                                     </td>
                                     <td className="px-4 py-2.5 text-gray-600">
                                       {factura.numeroOperacion || (
                                         <span className="text-gray-300">—</span>
                                       )}
                                     </td>
                                     <td className="px-4 py-2.5 text-right font-mono">
                                       {fmtCurrency(factura.monto)}
                                     </td>
                                     <td className="px-4 py-2.5 text-gray-600">
                                       {factura.bancoNombre || (
                                         <span className="text-gray-300">—</span>
                                       )}
                                     </td>
                                     <td className="px-4 py-2.5 text-gray-600">
                                       {factura.medioPago || (
                                         <span className="text-gray-300">—</span>
                                       )}
                                     </td>
                                   </tr>
                                 </tbody>
                               </table>
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
    </div>
  );
}
