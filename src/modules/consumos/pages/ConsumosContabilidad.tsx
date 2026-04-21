import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApi } from "@/hooks/useApi";
import { cn, fmtCurrency } from "@/lib/utils";
import { ArrowLeft, Ban, MoreHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable, FilterPills, SortableTh } from "@/components/data-table";
import { ConsumosStatusFilter } from "../components/filters/ConsumosStatusFilter";
import { AnularConsumoModal } from "../components/AnularConsumoModal";
import { toast } from "sonner";
import { useTableState } from "@/hooks/useTableState";

import { StatCard } from "@/modules/cierres/components/cierre-stat";
import type { ConsumidorResponse } from "@/domain/dto/consumo/ConsumidorResponse";
import type { PuntoDeVentaResponse } from "@/domain/dto/pto-venta/PuntoDeVentaResponse";
import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";

import type { ConsumoResponse } from "@/domain/dto/consumo/ConsumoResponse";
import type { AgrupadosResponse } from "@/domain/dto/consumo/AgrupadosResponse";

export default function ConsumosContabilidad() {
  const navigate = useNavigate();
  const { get, del } = useApi();

  const [consumos, setConsumos] = useState<ConsumoResponse[]>([]);
  const [consumidores, setConsumidores] = useState<ConsumidorResponse[]>([]);
  const [puntosDeVenta, setPuntosDeVenta] = useState<PuntoDeVentaResponse[]>(
    [],
  );
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [selectedConsumo, setSelectedConsumo] =
    useState<ConsumoResponse | null>(null);
  const [anularModalOpen, setAnularModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"detailed" | "grouped">("detailed");
  const [agrupados, setAgrupados] = useState<AgrupadosResponse[]>([]);

  const [dateDesde, setDateDesde] = useState("");
  const [dateHasta, setDateHasta] = useState("");

  useEffect(() => {
    Promise.all([
      get("/consumos"),
      get("/consumos/consumidores/all"),
      get("/comedores/puntos-de-venta"),
      get("/comedores"),
      get("/consumos/agrupados"),
    ]).then(
      ([consumosRes, consumidoresRes, pvRes, comedoresRes, agrupados]) => {
        consumosRes
          .json()
          .then((data) => setConsumos(Array.isArray(data) ? data : []));
        consumidoresRes.json().then(setConsumidores);
        pvRes.json().then(setPuntosDeVenta);
        comedoresRes.json().then(setComedores);
        agrupados
          .json()
          .then((data) => setAgrupados(Array.isArray(data) ? data : []));
      },
    );
  }, [get]);

  const consumidorById = useMemo(
    () => Object.fromEntries(consumidores.map((c) => [c.id, c])),
    [consumidores],
  );

  const puntoDeVentaNameById = useMemo(
    () => Object.fromEntries(puntosDeVenta.map((p) => [p.id, p.nombre])),
    [puntosDeVenta],
  );

  const comedorNameById = useMemo(
    () => Object.fromEntries(comedores.map((c) => [c.id, c.nombre])),
    [comedores],
  );

  const consumosAfterDateFilter = useMemo(() => {
    let list = [...consumos];
    if (dateDesde) list = list.filter((c) => c.fecha >= dateDesde);
    if (dateHasta) list = list.filter((c) => c.fecha <= dateHasta);
    return list;
  }, [consumos, dateDesde, dateHasta]);

  const { displayed, sort, filters } = useTableState(consumosAfterDateFilter, {
    searchFields: (c) => [
      consumidorById[c.consumidorId]?.nombre ?? "",
      puntoDeVentaNameById[c.PuntoDeVentaId] ?? "",
      c.fecha,
      c.observaciones ?? "",
    ],
    statusField: "anulacion",
    statusMapping: {
      active: { filter: (c) => c.anulacion === null },
      anulado: { filter: (c) => c.anulacion !== null },
    },
    defaultSortKey: "fecha",
  });

  const groupedAfterDateFilter = useMemo(() => {
    let list = [...agrupados];
    if (dateDesde) list = list.filter((a) => a.fecha >= dateDesde);
    if (dateHasta) list = list.filter((a) => a.fecha <= dateHasta);
    return list;
  }, [agrupados, dateDesde, dateHasta]);

  const { displayed: groupedDisplayed, sort: groupedSort } = useTableState(
    groupedAfterDateFilter,
    {
      searchFields: (a) => [a.fecha, ...a.puntosDeVenta],
      defaultSortKey: "fecha",
    },
  );

  const handleAnular = async (consumoId: number, motivo: string) => {
    try {
      const updated = await del(`/consumos/${consumoId}`, {
        body: JSON.stringify({ motivo }),
      }).then((r) => r.json());
      setConsumos((prev) =>
        prev.map((c) => (c.id === consumoId ? updated : c)),
      );
      toast("Consumo anulado");
    } catch (err) {
      toast("Error", {
        description:
          err instanceof Error ? err.message : "No se pudo anular el consumo",
      });
      throw err;
    }
  };

  const sortProps = {
    sortKey: sort.key,
    sortDir: sort.dir,
    onSort: sort.handleSort,
  };

  const groupedSortProps = {
    sortKey: groupedSort.key,
    sortDir: groupedSort.dir,
    onSort: groupedSort.handleSort,
  };

  const totalActivos = consumos.filter((c) => c.anulacion === null).length;
  const totalAnulados = consumos.filter((c) => c.anulacion !== null).length;
  const montoTotal = consumos
    .filter((c) => c.anulacion === null)
    .reduce((s, c) => s + c.total, 0);
  const montoFiltrado = displayed
    .filter((c) => c.anulacion === null)
    .reduce((s, c) => s + c.total, 0);
  const isFiltered = displayed.length !== consumos.length;

  return (
    <div className="px-18 py-8">
      <div className="max-w-3/4 mx-auto">
        <Button variant="ghost" onClick={() => navigate("/contabilidad")}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>

      <div className="mx-auto max-w-3/4 grid grid-cols-2 gap-4 sm:grid-cols-5 pb-4">
        <StatCard label="Total consumos" value={consumos.length} />
        <StatCard label="Activos" value={totalActivos} accent="emerald" />
        <StatCard label="Anulados" value={totalAnulados} accent="red" />
        <StatCard label="Monto total" value={fmtCurrency(montoTotal)} />
        <StatCard
          label={isFiltered ? "Monto filtrado" : "Monto activo"}
          value={fmtCurrency(montoFiltrado)}
          accent={isFiltered ? "blue" : undefined}
        />
      </div>

      <Card className="mx-auto max-w-3/4 py-6 border-0 shadow-md rounded-xl">
        <CardHeader className="border-b px-6 py-4">
          <div className="flex flex-row justify-between">
            <CardTitle className="text-xl font-bold text-gray-800">
              Consumos
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
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            displayedCount={
              viewMode === "detailed"
                ? displayed.length
                : groupedDisplayed.length
            }
            toolbarLeft={
              <div className="flex flex-wrap items-center gap-2">
                <FilterPills
                  options={[
                    { value: "detailed", label: "Detallado" },
                    { value: "grouped", label: "Agrupado" },
                  ]}
                  value={viewMode}
                  onChange={(v) => setViewMode(v as "detailed" | "grouped")}
                />
                {viewMode === "detailed" && (
                  <>
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => filters.setSearch(e.target.value)}
                      placeholder="Buscar..."
                      className="h-8 w-52 pl-3 pr-8 text-sm bg-gray-50 border border-gray-200 rounded-md"
                    />
                    <ConsumosStatusFilter
                      value={filters.status as "all" | "active" | "anulado"}
                      onChange={filters.setStatus}
                    />
                  </>
                )}
              </div>
            }
            columns={
              viewMode === "detailed" ? (
                <>
                  <SortableTh label="Fecha" col="fecha" {...sortProps} />
                  <th className="px-4 py-3">Comedor</th>
                  <th className="px-4 py-3">Punto de Venta</th>
                  <th className="px-4 py-3">Consumidor</th>
                  <th className="px-4 py-3">Productos</th>
                  <SortableTh
                    label="Total"
                    col="total"
                    {...sortProps}
                    className="text-right"
                  />
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3">Observaciones</th>
                  <th className="px-4 py-3 w-12" />
                </>
              ) : (
                <>
                  <SortableTh label="Fecha" col="fecha" {...groupedSortProps} />
                  <th className="px-4 py-3">Puntos de Venta</th>
                  <SortableTh
                    label="Consumos"
                    col="cantidadConsumos"
                    {...groupedSortProps}
                  />
                  <SortableTh
                    label="Consumidores"
                    col="cantidadConsumidores"
                    {...groupedSortProps}
                  />
                  <SortableTh
                    label="Total"
                    col="total"
                    {...groupedSortProps}
                    className="text-right"
                  />
                </>
              )
            }
            rows={
              viewMode === "detailed" ? (
                <>
                  {displayed.map((consumo) => {
                    const isAnulado = consumo.anulacion !== null;
                    const consumidor = consumidorById[consumo.consumidorId];
                    const comedorNombre = consumidor
                      ? (comedorNameById[consumidor.comedorId] ??
                        String(consumidor.comedorId))
                      : "—";
                    const pvNombre =
                      puntoDeVentaNameById[consumo.PuntoDeVentaId] ??
                      String(consumo.PuntoDeVentaId);

                    return (
                      <tr
                        key={consumo.id}
                        className={cn(
                          "border-b transition-colors",
                          isAnulado
                            ? "bg-red-50/30 text-gray-400"
                            : "hover:bg-gray-50/80",
                        )}
                      >
                        <td className="px-4 py-4 font-medium whitespace-nowrap">
                          {consumo.fecha}
                        </td>
                        <td className="px-4 py-4">{comedorNombre}</td>
                        <td className="px-4 py-4">{pvNombre}</td>
                        <td className="px-4 py-4">
                          {consumidor?.nombre ?? String(consumo.consumidorId)}
                        </td>
                        <td className="px-4 py-3">
                          {consumo.productos.length === 0 ? (
                            <span className="text-gray-300">—</span>
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              {consumo.productos.map((p, i) => (
                                <span key={i} className="text-xs text-gray-600">
                                  {p.producto.nombre}{" "}
                                  <span className="font-semibold">
                                    x{p.cantidad.toLocaleString("es-AR")}
                                  </span>
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right font-mono">
                          {fmtCurrency(consumo.total)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {isAnulado ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600">
                              <Ban className="h-3 w-3" /> Anulado
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                              Activo
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-gray-500 max-w-[160px] truncate">
                          {consumo.observaciones || (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td
                          className="px-4 py-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {!isAnulado && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
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
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedConsumo(consumo);
                                    setAnularModalOpen(true);
                                  }}
                                  className="gap-2.5 cursor-pointer rounded-lg text-red-600 focus:text-red-700 focus:bg-red-50"
                                >
                                  <Ban className="h-4 w-4" /> Anular
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </>
              ) : (
                <>
                  {groupedDisplayed.map((agrupado) => (
                    <tr
                      key={agrupado.fecha}
                      className="border-b transition-colors hover:bg-gray-50/80"
                    >
                      <td className="px-4 py-4 font-medium whitespace-nowrap">
                        {agrupado.fecha}
                      </td>
                      <td className="px-4 py-4">
                        {agrupado.puntosDeVenta.length === 0 ? (
                          <span className="text-gray-300">—</span>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            {agrupado.puntosDeVenta.map((pv, i) => (
                              <span key={i} className="text-xs text-gray-600">
                                {pv}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {agrupado.cantidadConsumos.toLocaleString("es-AR")}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {agrupado.cantidadConsumidores.toLocaleString("es-AR")}
                      </td>
                      <td className="px-4 py-4 text-right font-mono">
                        {fmtCurrency(agrupado.total)}
                      </td>
                    </tr>
                  ))}
                </>
              )
            }
          />
        </CardContent>
      </Card>

      <AnularConsumoModal
        open={anularModalOpen}
        onClose={() => setAnularModalOpen(false)}
        consumo={selectedConsumo}
        consumidorNombre={
          selectedConsumo
            ? (consumidorById[selectedConsumo.consumidorId]?.nombre ??
              String(selectedConsumo.consumidorId))
            : ""
        }
        onConfirm={handleAnular}
      />
    </div>
  );
}
