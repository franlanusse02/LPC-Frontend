import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi } from "@/hooks/useApi";
import { cn, fmtCurrency } from "@/lib/utils";
import { ArrowLeft, Ban, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable, SortableTh } from "@/components/data-table";
import { Pagination } from "@/components/Pagination";
import { ConsumosStatusFilter } from "../components/filters/ConsumosStatusFilter";
import type { ConsumoResponse } from "@/domain/dto/consumo/ConsumoResponse";
import type { ConsumoStatsResponse } from "@/domain/dto/consumo/ConsumoStatsResponse";
import type { ConsumidorResponse } from "@/domain/dto/consumo/ConsumidorResponse";
import type { PuntoDeVentaResponse } from "@/domain/dto/pto-venta/PuntoDeVentaResponse";
import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";
import type { Page } from "@/domain/dto/shared/Page";
import { StatCard } from "@/modules/cierres/components/CierreStat";
import { ListFilters, type ListFilterState } from "@/components/ListFilters";
import { defaultFilters } from "@/components/list-filter-defaults";
import { buildQuery } from "@/lib/query-string";

type StatusFilter = "all" | "active" | "anulado";

export default function ConsumosCargaDatos() {
  const navigate = useNavigate();
  const { get } = useApi();

  const [consumidores, setConsumidores] = useState<ConsumidorResponse[]>([]);
  const [puntosDeVenta, setPuntosDeVenta] = useState<PuntoDeVentaResponse[]>(
    [],
  );
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);

  const [listFilters, setListFiltersRaw] = useState<ListFilterState>(defaultFilters);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [sortKey, setSortKey] = useState("fecha");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [pageData, setPageData] = useState<Page<ConsumoResponse> | null>(null);
  const [stats, setStats] = useState<ConsumoStatsResponse | null>(null);

  const consumos = pageData?.content ?? [];

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    Promise.all([
      get("/consumos/consumidores/all"),
      get("/comedores/puntos-de-venta"),
      get("/comedores"),
    ]).then(([consumidoresRes, pvRes, comedoresRes]) => {
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
      comedorId: listFilters.comedorId || undefined,
      consumidorId: listFilters.consumidorId || undefined,
      puntoDeVentaIds: listFilters.puntoDeVentaIds,
      anulado: statusFilter === "all" ? undefined : statusFilter === "anulado",
      fechaInicio: listFilters.desde,
      fechaFin: listFilters.hasta,
      search: search || undefined,
      page,
      size,
      sort: `${sortKey},${sortDir}`,
    });
    return get(`/consumos${qs}`).then((r) => r.json()).then(setPageData);
  }, [get, listFilters.comedorId, listFilters.consumidorId, listFilters.puntoDeVentaIds, listFilters.desde, listFilters.hasta, statusFilter, search, page, size, sortKey, sortDir]);

  const fetchStats = useCallback(() => {
    const qs = buildQuery({
      comedorId: listFilters.comedorId || undefined,
      consumidorId: listFilters.consumidorId || undefined,
      puntoDeVentaIds: listFilters.puntoDeVentaIds,
      fechaInicio: listFilters.desde,
      fechaFin: listFilters.hasta,
      search: search || undefined,
    });
    return get(`/consumos/stats${qs}`).then((r) => r.json()).then(setStats);
  }, [get, listFilters.comedorId, listFilters.consumidorId, listFilters.puntoDeVentaIds, listFilters.desde, listFilters.hasta, search]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const sortProps = { sortKey, sortDir, onSort: handleSort };

  const isFiltered = !!stats && stats.montoTotalActivo !== stats.montoFiltradoActivo;

  return (
    <div className="px-4 sm:px-8 lg:px-18 py-8">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/carga-datos")}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>

      <div className="mx-auto max-w-7xl grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 pb-4">
        <StatCard label="Total consumos" value={stats?.total ?? 0} />
        <StatCard label="Activos" value={stats?.activos ?? 0} accent="emerald" />
        <StatCard label="Anulados" value={stats?.anulados ?? 0} accent="red" />
        <StatCard label="Monto total" value={fmtCurrency(stats?.montoTotalActivo ?? 0)} />
        <StatCard
          label={isFiltered ? "Monto filtrado" : "Monto activo"}
          value={fmtCurrency(stats?.montoFiltradoActivo ?? 0)}
          accent={isFiltered ? "blue" : undefined}
        />
      </div>

      <Card className="mx-auto max-w-7xl py-6 border-0 shadow-md rounded-xl">
        <CardHeader className="border-b px-6 py-4">
          <div className="w-full flex flex-row justify-between">
            <CardTitle className="text-xl font-bold text-gray-800">
              Tus Consumos
            </CardTitle>
            <Button
              size="sm"
              onClick={() => navigate("/carga-datos/consumos/nuevo")}
              className="gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-wide hover:scale-105 transition"
            >
              <Plus className="h-4 w-4" /> Nuevo Consumo
            </Button>
          </div>
          <div className="pt-3">
            <ListFilters
              filters={listFilters}
              onChange={handleFiltersChange}
              comedores={comedores}
              consumidores={consumidores}
              showSociedad={false}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            displayedCount={pageData?.numberOfElements ?? 0}
            toolbarLeft={
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Buscar..."
                  className="h-8 w-52 pl-3 pr-8 text-sm bg-gray-50 border border-gray-200 rounded-md"
                />
                <ConsumosStatusFilter
                  value={statusFilter}
                  onChange={handleStatusChange}
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
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3">Observaciones</th>
              </>
            }
            rows={
              <>
                {consumos.map((consumo) => {
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
    </div>
  );
}
