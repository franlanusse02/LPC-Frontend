import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi } from "@/hooks/useApi";
import { cn, fmtCurrency } from "@/lib/utils";
import { ArrowLeft, Ban, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DetailedCierreCajaResponse } from "../types/CierreCajaResponse";
import type { MovimientoResponse } from "../types/MovimientoResponse";
import { DataTable, SortableTh } from "@/components/data-table";
import { MovimientoRow, AnuladosGroup } from "../components/MovimientoRow";
import { CierresStatusFilter } from "../components/filters/CierresStatusFilter";
import { useTableState } from "@/hooks/useTableState";

export default function CierresPage() {
  const navigate = useNavigate();
  const { get } = useApi();

  const [cierres, setCierres] = useState<DetailedCierreCajaResponse[]>([]);

  useEffect(() => {
    get("/cierres")
      .then((r) => r.json())
      .then(setCierres);
  }, [get]);

  const { displayed, sort, expansion, filters } = useTableState(cierres, {
    searchFields: (c) => [
      c.comedor.nombre,
      c.puntoDeVenta.nombre,
      c.creadoPor.nombre,
      c.fechaOperacion,
      c.comentarios || "",
    ],
    statusField: "anulacionId",
    statusMapping: {
      active: { filter: (c) => !c.anulacionId },
      anulado: { filter: (c) => !!c.anulacionId },
    },
    sortKeyMapping: {
      comedor: (c) => c.comedor.nombre,
      creadoPor: (c) => c.creadoPor.nombre,
      puntoDeVenta: (c) => c.puntoDeVenta.nombre,
    },
    defaultSortKey: "fechaOperacion",
  });

  const sortProps = {
    sortKey: sort.key,
    sortDir: sort.dir,
    onSort: sort.handleSort,
  };

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
              Tus Cierres
            </CardTitle>
            <Button
              size="sm"
              onClick={() => navigate("/encargado/cierres/nuevo")}
              className="gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-wide hover:scale-105 transition"
            >
              <Plus className="h-4 w-4" /> Nuevo Cierre
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            displayedCount={displayed.length}
            toolbarLeft={
              <div className="flex flex-wrap items-center gap-2">
                <CierresStatusFilter
                  value={filters.status as "all" | "active" | "anulado"}
                  onChange={filters.setStatus}
                />
              </div>
            }
            columns={
              <>
                <th className="px-4 py-3 w-8" />
                <SortableTh label="Fecha" col="fechaOperacion" {...sortProps} />
                <SortableTh label="Comedor" col="comedor" {...sortProps} />
                <SortableTh label="Creado por" col="creadoPor" {...sortProps} />
                <SortableTh
                  label="Punto de Venta"
                  col="puntoDeVenta"
                  {...sortProps}
                />
                <SortableTh
                  label="Platos"
                  col="totalPlatosVendidos"
                  {...sortProps}
                  className="text-center"
                />
                <SortableTh
                  label="Monto Total"
                  col="montoTotal"
                  {...sortProps}
                  className="text-right"
                />
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3">Comentarios</th>
              </>
            }
            rows={
              <>
                {displayed.map((cierre) => {
                  const isExpanded = expansion.expandedRows.has(cierre.id);
                  const isAnulado = !!cierre.anulacionId;
                  const movimientos: MovimientoResponse[] =
                    cierre.movimientos ?? [];
                  const activeMovs = movimientos.filter((m) => !m.anulacionId);
                  const anuladosMovs = movimientos.filter(
                    (m) => !!m.anulacionId,
                  );

                  return (
                    <Fragment key={cierre.id}>
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
                          onClick={() => expansion.toggleRow(cierre.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </td>
                        <td
                          className="px-4 py-4 font-medium whitespace-nowrap cursor-pointer"
                          onClick={() => expansion.toggleRow(cierre.id)}
                        >
                          {cierre.fechaOperacion}
                        </td>
                        <td
                          className="px-4 py-4 cursor-pointer"
                          onClick={() => expansion.toggleRow(cierre.id)}
                        >
                          {cierre.comedor.nombre}
                        </td>
                        <td
                          className="px-4 py-4 cursor-pointer"
                          onClick={() => expansion.toggleRow(cierre.id)}
                        >
                          {cierre.creadoPor.nombre}
                        </td>
                        <td
                          className="px-4 py-4 cursor-pointer"
                          onClick={() => expansion.toggleRow(cierre.id)}
                        >
                          {cierre.puntoDeVenta.nombre}
                        </td>
                        <td
                          className="px-4 py-4 text-center cursor-pointer"
                          onClick={() => expansion.toggleRow(cierre.id)}
                        >
                          {cierre.totalPlatosVendidos}
                        </td>
                        <td
                          className="px-4 py-4 text-right font-mono cursor-pointer"
                          onClick={() => expansion.toggleRow(cierre.id)}
                        >
                          {fmtCurrency(cierre.montoTotal)}
                        </td>
                        <td
                          className="px-4 py-4 text-center cursor-pointer"
                          onClick={() => expansion.toggleRow(cierre.id)}
                        >
                          {isAnulado ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600">
                              <Ban className="h-3 w-3" />
                              Anulado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                              Activo
                            </span>
                          )}
                        </td>
                        <td
                          className="px-4 py-4 text-gray-500 cursor-pointer max-w-[160px] truncate"
                          onClick={() => expansion.toggleRow(cierre.id)}
                        >
                          {cierre.comentarios || (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-gray-50/60">
                          <td colSpan={9} className="px-8 py-4">
                            {movimientos.length === 0 ? (
                              <p className="text-sm italic text-gray-400">
                                Sin movimientos registrados
                              </p>
                            ) : (
                              <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="bg-gray-100 text-left text-xs uppercase text-gray-500 tracking-wider">
                                      <th className="px-4 py-2.5">
                                        Fecha y Hora
                                      </th>
                                      <th className="px-4 py-2.5">
                                        Medio de Pago
                                      </th>
                                      <th className="px-4 py-2.5 text-right">
                                        Monto
                                      </th>
                                      <th className="px-4 py-2.5 text-center">
                                        Estado
                                      </th>
                                      <th className="px-4 py-2.5">
                                        Comentarios
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {activeMovs.map((mov) => (
                                      <MovimientoRow key={mov.id} mov={mov} />
                                    ))}
                                    {anuladosMovs.length > 0 && (
                                      <AnuladosGroup
                                        movimientos={anuladosMovs}
                                      />
                                    )}
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
    </div>
  );
}
