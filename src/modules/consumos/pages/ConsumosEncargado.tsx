import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi } from "@/hooks/useApi";
import { cn, fmtCurrency } from "@/lib/utils";
import { ArrowLeft, Ban, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable, SortableTh } from "@/components/data-table";
import { ConsumosStatusFilter } from "../components/filters/ConsumosStatusFilter";
import { useTableState } from "@/hooks/useTableState";
import type { ConsumoResponse } from "@/domain/dto/consumo/ConsumoResponse";
import type { ConsumidorResponse } from "@/domain/dto/consumo/ConsumidorResponse";
import type { PuntoDeVentaResponse } from "@/domain/dto/pto-venta/PuntoDeVentaResponse";
import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";

export default function ConsumosEncargado() {
  const navigate = useNavigate();
  const { get } = useApi();

  const [consumos, setConsumos] = useState<ConsumoResponse[]>([]);
  const [consumidores, setConsumidores] = useState<ConsumidorResponse[]>([]);
  const [puntosDeVenta, setPuntosDeVenta] = useState<PuntoDeVentaResponse[]>(
    [],
  );
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);

  useEffect(() => {
    Promise.all([
      get("/consumos"),
      get("/consumos/consumidores/all"),
      get("/comedores/puntos-de-venta"),
      get("/comedores"),
    ]).then(([consumosRes, consumidoresRes, pvRes, comedoresRes]) => {
      consumosRes
        .json()
        .then((data) => setConsumos(Array.isArray(data) ? data : []));
      consumidoresRes.json().then(setConsumidores);
      pvRes.json().then(setPuntosDeVenta);
      comedoresRes.json().then(setComedores);
    });
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

  const { displayed, sort, filters } = useTableState(consumos, {
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

  const sortProps = {
    sortKey: sort.key,
    sortDir: sort.dir,
    onSort: sort.handleSort,
  };

  return (
    <div className="px-18 py-8">
      <div className="max-w-3/4 mx-auto">
        <Button variant="ghost" onClick={() => navigate("/encargado")}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>
      <Card className="mx-auto max-w-3/4 py-6 border-0 shadow-md rounded-xl">
        <CardHeader className="border-b px-6 py-4">
          <div className="w-full flex flex-row justify-between">
            <CardTitle className="text-xl font-bold text-gray-800">
              Tus Consumos
            </CardTitle>
            <Button
              size="sm"
              onClick={() => navigate("/encargado/consumos/nuevo")}
              className="gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-wide hover:scale-105 transition"
            >
              <Plus className="h-4 w-4" /> Nuevo Consumo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            displayedCount={displayed.length}
            toolbarLeft={
              <div className="flex flex-wrap items-center gap-2">
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
              </div>
            }
            columns={
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
              </>
            }
            rows={
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
                    </tr>
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
