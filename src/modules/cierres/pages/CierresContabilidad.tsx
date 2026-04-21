import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi } from "@/hooks/useApi";
import { cn, fmtCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  Ban,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DetailedCierreCajaResponse } from "@/domain/dto/cierre-caja/CierreCajaResponse";
import type { MovimientoResponse } from "@/domain/dto/movimiento/MovimientoResponse";
import { DataTable, SortableTh } from "@/components/data-table";
import { MovimientoRow, AnuladosGroup } from "../components/MovimientoRow";
import { CierresStatusFilter } from "../components/filters/CierresStatusFilter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AnularCierreModal } from "@/modules/cierres/components/anular-cierre-modal";
import { useTableState } from "@/hooks/useTableState";
import { StatCard } from "../components/cierre-stat";

export default function CierresContabilidad() {
  const navigate = useNavigate();
  const { get, del } = useApi();

  const [cierres, setCierres] = useState<DetailedCierreCajaResponse[]>([]);

  const [anularCierreModalOpen, setAnularCierreModalOpen] = useState(false);
  const [selectedCierre, setSelectedCierre] =
    useState<DetailedCierreCajaResponse | null>(null);

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

  const handleAnularCierre = async (id: number, motivo: string) => {
    const cierre = cierres.find((c) => c.id === id);
    if (cierre) {
      const res = await del(`/cierres/${id}`, {
        body: JSON.stringify({ motivo: motivo }),
      });
      setSelectedCierre(null);
      setAnularCierreModalOpen(false);
      if (res.ok) {
        const newCierre = (await res.json()) as DetailedCierreCajaResponse;
        setCierres((prev) => prev.map((c) => (c.id === id ? newCierre : c)));
      }
    }
  };

  const sortProps = {
    sortKey: sort.key,
    sortDir: sort.dir,
    onSort: sort.handleSort,
  };

  const totalActivos = cierres.filter((c) => !c.anulacionId).length;
  const totalAnulados = cierres.filter((c) => !!c.anulacionId).length;
  const montoTotal = cierres
    .filter((c) => !c.anulacionId)
    .reduce((s, c) => s + c.montoTotal, 0);
  const montoFiltrado = displayed
    .filter((c) => !c.anulacionId)
    .reduce((s, c) => s + c.montoTotal, 0);
  const isFiltered = displayed.length !== cierres.length;

  return (
    <div className="px-18 py-8">
      <div className="max-w-2/3 mx-auto">
        <Button variant="ghost" onClick={() => navigate("/contabilidad")}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>

      <div className="mx-auto max-w-2/3 grid grid-cols-2 gap-4 sm:grid-cols-5 pb-4">
        <StatCard label="Total cierres" value={cierres.length} />
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
              Cierres
            </CardTitle>
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
                <th className="px-4 py-3 w-12" />
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
                              <Ban className="h-3 w-3" /> Anulado
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
                        <td className="px-4 py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild disabled={isAnulado}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 data-[state=open]:bg-gray-100 disabled:opacity-30"
                                aria-label="Acciones"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-44 rounded-xl shadow-lg border-gray-100"
                            >
                              <DropdownMenuItem
                                onClick={() => {
                                  navigate(
                                    `/contabilidad/cierres/${cierre.id}`,
                                  );
                                }}
                                className="gap-2.5 cursor-pointer rounded-lg text-gray-700 focus:text-gray-900"
                              >
                                <Pencil className="h-4 w-4 text-gray-400" />{" "}
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1" />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedCierre(cierre);
                                  setAnularCierreModalOpen(true);
                                }}
                                className="gap-2.5 cursor-pointer rounded-lg text-red-600 focus:text-red-700 focus:bg-red-50"
                              >
                                <Ban className="h-4 w-4" /> Anular
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-gray-50/60">
                          <td colSpan={10} className="px-8 py-4">
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
      <AnularCierreModal
        open={anularCierreModalOpen}
        onClose={() => setAnularCierreModalOpen(false)}
        cierre={selectedCierre}
        onConfirm={handleAnularCierre}
      />
    </div>
  );
}
