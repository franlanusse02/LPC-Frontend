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
  CircleDollarSign,
  MoreHorizontal,
  Pencil,
  Send,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable, SortableTh } from "@/components/data-table";
import { FacturasStatusFilter } from "../components/filters/FacturasStatusFilter";
import { EmitirFacturaModal } from "../components/EmitirFacturaModal";
import { AnularFacturaModal } from "../components/AnularFacturaModal";
import { PagarFacturaModal } from "../components/PagarFacturaModal";
import { toast } from "sonner";
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

interface PageResponse<T> {
  content: T[];
}

export default function ComprasContabilidad() {
  const navigate = useNavigate();
  const { get, patch, del } = useApi();

  const [emitirFactura, setEmitirFactura] =
    useState<FacturaProveedorResponse | null>(null);
  const [anularFactura, setAnularFactura] =
    useState<FacturaProveedorResponse | null>(null);
  const [pagarFactura, setPagarFactura] =
    useState<FacturaProveedorResponse | null>(null);

  const [facturas, setFacturas] = useState<FacturaProveedorResponse[]>([]);
  const [proveedores, setProveedores] = useState<
    { id: number; nombre: string }[]
  >([]);
  const [comedores, setComedores] = useState<{ id: number; nombre: string }[]>(
    [],
  );

  const [dateDesde, setDateDesde] = useState("");
  const [dateHasta, setDateHasta] = useState("");
  const [comedorFilter, setComedorFilter] = useState("");

  const handleEmitir = async (
    facturaId: number,
    fechaEmision: string,
    fechaPago: string | null,
  ) => {
    try {
      const updated = await patch(`/facturas/proveedor/${facturaId}/emitir`, {
        fechaEmision,
        fechaPago,
      }).then((r) => r.json());
      setFacturas((prev) =>
        prev.map((f) => (f.id === facturaId ? updated : f)),
      );
      toast("Factura emitida");
    } catch (err) {
      toast("Error", {
        description:
          err instanceof Error ? err.message : "No se pudo emitir la factura",
      });
      throw err;
    }
  };

  const handleAnular = async (facturaId: number, motivo: string) => {
    try {
      const updated = await del(`/facturas/proveedor/${facturaId}`, {
        body: JSON.stringify({ motivo }),
      }).then((r) => r.json());
      setFacturas((prev) =>
        prev.map((f) => (f.id === facturaId ? updated : f)),
      );
      toast("Factura anulada");
    } catch (err) {
      toast("Error", {
        description:
          err instanceof Error ? err.message : "No se pudo anular la factura",
      });
      throw err;
    }
  };

  const handlePagar = async (facturaId: number, fechaPago: string) => {
    try {
      const updated = await patch(`/facturas/proveedor/${facturaId}/pagar`, {
        fechaPago,
      }).then((r) => r.json());
      setFacturas((prev) =>
        prev.map((f) => (f.id === facturaId ? updated : f)),
      );
      toast("Pago registrado");
    } catch (err) {
      toast("Error", {
        description:
          err instanceof Error ? err.message : "No se pudo registrar el pago",
      });
      throw err;
    }
  };

  useEffect(() => {
    Promise.all([
      get("/facturas/proveedor"),
      get("/proveedores"),
      get("/comedores"),
    ]).then(([facturasRes, proveedoresRes, comedoresRes]) => {
      facturasRes
        .json()
        .then((data: PageResponse<FacturaProveedorResponse>) =>
          setFacturas(Array.isArray(data?.content) ? data.content : []),
        );
      proveedoresRes.json().then(setProveedores);
      comedoresRes.json().then(setComedores);
    });
  }, [get]);

  const proveedorNameById = useMemo(
    () => Object.fromEntries(proveedores.map((p) => [p.id, p.nombre])),
    [proveedores],
  );

  const comedorNameById = useMemo(
    () => Object.fromEntries(comedores.map((c) => [c.id, c.nombre])),
    [comedores],
  );

  const comedorOptions = useMemo(
    () => [...new Set(comedores.map((c) => c.nombre))].sort(),
    [comedores],
  );

  // Build filtered list based on date range and comedor
  const facturasAfterDateFilter = useMemo(() => {
    let list = [...facturas];
    if (dateDesde) list = list.filter((f) => f.fechaFactura >= dateDesde);
    if (dateHasta) list = list.filter((f) => f.fechaFactura <= dateHasta);
    if (comedorFilter) {
      const ids = new Set(
        comedores.filter((c) => c.nombre === comedorFilter).map((c) => c.id),
      );
      list = list.filter((f) => ids.has(f.comedorId));
    }
    return list;
  }, [facturas, dateDesde, dateHasta, comedorFilter, comedores]);

  const { displayed, sort, filters } = useTableState(facturasAfterDateFilter, {
    searchFields: (f) => [
      f.numero,
      (proveedorNameById[f.proveedorId] ?? "").toLowerCase(),
      (comedorNameById[f.comedorId] ?? "").toLowerCase(),
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
        <Button variant="ghost" onClick={() => navigate("/contabilidad")}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>
      <Card className="mx-auto max-w-2/3 py-6 border-0 shadow-md rounded-xl">
        <CardHeader className="border-b px-6 py-4">
          <div className="w-full flex flex-row justify-between">
            <CardTitle className="text-xl font-bold text-gray-800">
              Facturas de Compras
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
            {comedorOptions.length > 0 && (
              <select
                value={comedorFilter}
                onChange={(e) => setComedorFilter(e.target.value)}
                className="h-8 rounded-md border border-gray-200 bg-gray-50 px-2 text-sm text-gray-600"
              >
                <option value="">Todos los comedores</option>
                {comedorOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
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
                <SortableTh
                  label="Fecha Emision"
                  col="fechaFactura"
                  {...sortProps}
                />
                <SortableTh
                  label="Fecha Pago"
                  col="fechaFactura"
                  {...sortProps}
                />
                <SortableTh label="Estado" col="estado" {...sortProps} />
                <th className="px-4 py-3 w-12">Acciones</th>
              </>
            }
            rows={
              <>
                {displayed.map((factura) => {
                  const isAnulada = factura.estado === "ANULADA";
                  const styles = ESTADO_STYLES[factura.estado];
                  const proveedor = proveedorNameById[factura.proveedorId];
                  const comedor = comedorNameById[factura.comedorId];

                  return (
                    <tr
                      key={factura.id}
                      className={cn(
                        "border-b transition-colors",
                        isAnulada
                          ? "bg-red-50/30 text-gray-400"
                          : "hover:bg-gray-50/80",
                      )}
                    >
                      <td className="px-4 py-4 font-medium whitespace-nowrap">
                        {factura.numero}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {factura.fechaFactura}
                      </td>
                      <td className="px-4 py-4">
                        {proveedor || factura.proveedorId}
                      </td>
                      <td className="px-4 py-4">
                        {comedor || factura.comedorId}
                      </td>
                      <td className="px-4 py-4 text-right font-mono">
                        {fmtCurrency(factura.monto)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {factura.fechaEmision || (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {factura.fechaPago || (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
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
                        className="px-4 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {factura.estado !== "ANULADA" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              disabled={factura.estado === "PAGADA"}
                            >
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
                              className="w-44 rounded-xl shadow-lg border-gray-100"
                            >
                              {factura.estado === "PENDIENTE" && (
                                <DropdownMenuItem
                                  onClick={() => setEmitirFactura(factura)}
                                  className="gap-2.5 cursor-pointer rounded-lg text-blue-600 focus:text-blue-700 focus:bg-blue-50"
                                >
                                  <Send className="h-4 w-4" />
                                  Emitir
                                </DropdownMenuItem>
                              )}
                              {factura.estado === "EMITIDA" && (
                                <DropdownMenuItem
                                  onClick={() => setPagarFactura(factura)}
                                  className="gap-2.5 cursor-pointer rounded-lg text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50"
                                >
                                  <CircleDollarSign className="h-4 w-4" />
                                  Pagar
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(
                                    `/contabilidad/compras/${factura.id}/editar`,
                                  )
                                }
                                className="gap-2.5 cursor-pointer rounded-lg text-gray-700 focus:text-gray-900"
                              >
                                <Pencil className="h-4 w-4 text-gray-400" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1" />
                              <DropdownMenuItem
                                onClick={() => setAnularFactura(factura)}
                                className="gap-2.5 cursor-pointer rounded-lg text-red-600 focus:text-red-700 focus:bg-red-50"
                              >
                                <Ban className="h-4 w-4" />
                                Anular
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </>
            }
          />
        </CardContent>
      </Card>

      <EmitirFacturaModal
        open={!!emitirFactura}
        onClose={() => setEmitirFactura(null)}
        factura={emitirFactura}
        onConfirm={handleEmitir}
      />

      <AnularFacturaModal
        open={!!anularFactura}
        onClose={() => setAnularFactura(null)}
        factura={anularFactura}
        onConfirm={handleAnular}
      />

      <PagarFacturaModal
        open={!!pagarFactura}
        onClose={() => setPagarFactura(null)}
        factura={pagarFactura}
        onConfirm={handlePagar}
      />
    </div>
  );
}
