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
import { ArrowLeft, Ban, Download, Loader2, MoreHorizontal, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable, FilterPills, SortableTh } from "@/components/data-table";
import { Pagination } from "@/components/Pagination";
import { ConsumosStatusFilter } from "../components/filters/ConsumosStatusFilter";
import { AnularConsumoModal } from "../components/AnularConsumoModal";
import { toast } from "sonner";
import { useTableState } from "@/hooks/useTableState";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionModal } from "@/components/BulkActionModal";
import { handleBulkResponse } from "@/lib/bulk-utils";
import { exportToXlsx, type ExportColumn } from "@/lib/exportXlsx";
import type { BulkActionResponse } from "@/domain/dto/shared/BulkActionResponse";
import type { Page } from "@/domain/dto/shared/Page";

import { StatCard } from "@/modules/cierres/components/CierreStat";
import type { ConsumidorResponse } from "@/domain/dto/consumo/ConsumidorResponse";
import type { PuntoDeVentaResponse } from "@/domain/dto/pto-venta/PuntoDeVentaResponse";
import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";
import {
  ListFilters,
  type ListFilterState,
} from "@/components/ListFilters";
import { defaultFilters } from "@/components/list-filter-defaults";
import { buildQuery } from "@/lib/query-string";
import { useExportAll } from "@/hooks/useExportAll";

import type { ConsumoResponse } from "@/domain/dto/consumo/ConsumoResponse";
import type { ConsumoStatsResponse } from "@/domain/dto/consumo/ConsumoStatsResponse";
import type { AgrupadosResponse } from "@/domain/dto/consumo/AgrupadosResponse";

type StatusFilter = "all" | "active" | "anulado";

export default function ConsumosContabilidad() {
  const navigate = useNavigate();
  const { get, post, del } = useApi();

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

  const [listFilters, setListFiltersRaw] = useState<ListFilterState>({ ...defaultFilters, dateField: "fecha" });
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
  const { exporting, fetchAll } = useExportAll<ConsumoResponse>("/consumos");

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
      get("/consumos/agrupados"),
    ]).then(
      ([consumidoresRes, pvRes, comedoresRes, agrupadosRes]) => {
        consumidoresRes.json().then(setConsumidores);
        pvRes.json().then(setPuntosDeVenta);
        comedoresRes.json().then(setComedores);
        agrupadosRes
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

  const groupedAfterDateFilter = useMemo(() => {
    let list = [...agrupados];
    if (listFilters.desde) list = list.filter((a) => a.fecha >= listFilters.desde);
    if (listFilters.hasta) list = list.filter((a) => a.fecha <= listFilters.hasta);
    return list;
  }, [agrupados, listFilters.desde, listFilters.hasta]);

  const { displayed: groupedDisplayed, sort: groupedSort } = useTableState(
    groupedAfterDateFilter,
    {
      searchFields: (a) => [a.fecha, ...a.puntosDeVenta],
      defaultSortKey: "fecha",
    },
  );

  const handleAnular = async (consumoId: number, motivo: string) => {
    try {
      await del(`/consumos/${consumoId}`, {
        body: JSON.stringify({ motivo }),
      });
      toast("Consumo anulado");
      fetchList();
      fetchStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo anular el consumo");
      throw err;
    }
  };

  const sortProps = { sortKey, sortDir, onSort: handleSort };

  const selection = useRowSelection();

  const [bulkAnularOpen, setBulkAnularOpen] = useState(false);
  const [bulkMotivo, setBulkMotivo] = useState("");

  const selectedConsumos = consumos.filter((c) => selection.selected.has(c.id));
  const allAnulable = selectedConsumos.length > 0 && selectedConsumos.every((c) => c.anulacion === null);

  const selectableIds = consumos.filter((c) => c.anulacion === null).map((c) => c.id);

  const handleBulkAnular = async () => {
    const res = await post("/consumos/bulk/anular", {
      ids: [...selection.selected],
      motivo: bulkMotivo,
    }).then((r) => r.json() as Promise<BulkActionResponse>);
    handleBulkResponse(res, "Anulación");
    selection.clear();
    fetchList();
    fetchStats();
    setBulkMotivo("");
  };

  const exportColumns: ExportColumn<ConsumoResponse>[] = [
    { key: (c) => new Date(c.creadoEn).toLocaleString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    }), header: "Fecha de Carga" },
    { key: "id", header: "ID" },
    { key: (c) => { const cons = consumidorById[c.consumidorId]; return cons ? (comedorNameById[cons.comedorId] ?? cons.comedorId) : "—"; }, header: "Comedor" },
    { key: (c) => puntoDeVentaNameById[c.PuntoDeVentaId] ?? c.PuntoDeVentaId, header: "Punto de Venta" },
    { key: (c) => consumidorById[c.consumidorId]?.nombre ?? c.consumidorId, header: "Consumidor" },
    { key: "fecha", header: "Fecha" },
    { key: "total", header: "Total" },
    { key: (c) => c.anulacion ? "Anulado" : "Activo", header: "Estado" },
    { key: "observaciones", header: "Observaciones" },
    { key: (c) => c.productos.map((p) => `${p.producto.nombre} x${p.cantidad}`).join(", "), header: "Productos" },
    { key: "actualizadoEn", header: "Actualizado en" },
  ];

  const handleExport = async () => {
    const segments = ["consumos"];
    if (statusFilter !== "all") segments.push(statusFilter);
    if (listFilters.comedorId) segments.push(`comedor-${listFilters.comedorId}`);
    if (listFilters.desde) segments.push(`desde-${listFilters.desde}`);
    if (listFilters.hasta) segments.push(`hasta-${listFilters.hasta}`);

    if (selection.count > 0) {
      const data = consumos.filter((c) => selection.selected.has(c.id));
      exportToXlsx({ data, columns: exportColumns, filename: segments.join("-") });
      return;
    }

    try {
      const data = await fetchAll({
        comedorId: listFilters.comedorId || undefined,
        consumidorId: listFilters.consumidorId || undefined,
        puntoDeVentaIds: listFilters.puntoDeVentaIds,
        anulado: statusFilter === "all" ? undefined : statusFilter === "anulado",
        fechaInicio: listFilters.desde,
        fechaFin: listFilters.hasta,
        search: search || undefined,
      });
      exportToXlsx({ data, columns: exportColumns, filename: segments.join("-") });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo exportar");
    }
  };

  const groupedSortProps = {
    sortKey: groupedSort.key,
    sortDir: groupedSort.dir,
    onSort: groupedSort.handleSort,
  };

  const isFiltered = !!stats && stats.montoTotalActivo !== stats.montoFiltradoActivo;

  return (
    <div className="px-4 sm:px-8 lg:px-18 py-8">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/contabilidad")}>
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
          <CardTitle className="text-xl font-bold text-gray-800">
            Consumos
          </CardTitle>
          <div className="flex flex-row items-start justify-between gap-4 pt-3">
            <ListFilters
              filters={listFilters}
              onChange={handleFiltersChange}
              comedores={comedores}
              consumidores={consumidores}
              showSociedad={false}
            />
            <Button
              size="sm"
              onClick={() => navigate("/contabilidad/consumos/nuevo")}
              className="gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-wide hover:scale-105 transition shrink-0"
            >
              <Plus className="h-4 w-4" /> Nuevo Consumo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            displayedCount={
              viewMode === "detailed"
                ? (pageData?.numberOfElements ?? 0)
                : groupedDisplayed.length
            }
            selectionToolbar={
              viewMode === "detailed" && selection.count > 0 ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {selection.count} seleccionado{selection.count !== 1 ? "s" : ""}
                  </span>
                  {allAnulable && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => setBulkAnularOpen(true)}
                    >
                      <Ban className="size-4 mr-1.5" />
                      Anular
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
                    {exporting ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Download className="size-4 mr-1.5" />}
                    Exportar ({selection.count})
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={selection.clear}
                  >
                    Deseleccionar
                  </Button>
                </div>
              ) : undefined
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
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Buscar..."
                      className="h-8 w-52 pl-3 pr-8 text-sm bg-gray-50 border border-gray-200 rounded-md"
                    />
                    <ConsumosStatusFilter
                      value={statusFilter}
                      onChange={handleStatusChange}
                    />
                  </>
                )}
              </div>
            }
            toolbarRight={
              viewMode === "detailed" ? (
                <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
                  {exporting ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Download className="size-4 mr-1.5" />}
                  {selection.count > 0 ? `Exportar (${selection.count})` : "Exportar Excel"}
                </Button>
              ) : undefined
            }
            columns={
              viewMode === "detailed" ? (
                <>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={selection.isAllSelected(selectableIds)}
                      ref={(el) => {
                        if (el) el.indeterminate = selection.isSomeSelected() && !selection.isAllSelected(selectableIds);
                      }}
                      onChange={() => selection.toggleAll(selectableIds)}
                    />
                  </th>
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
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            disabled={isAnulado}
                            checked={selection.selected.has(consumo.id)}
                            onChange={() => selection.toggle(consumo.id)}
                          />
                        </td>
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
                        <td className="px-4 py-4 text-right font-mono whitespace-nowrap">
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
          {viewMode === "detailed" && (
            <Pagination
              page={pageData?.number ?? 0}
              size={pageData?.size ?? size}
              totalPages={pageData?.totalPages ?? 0}
              totalElements={pageData?.totalElements ?? 0}
              onPageChange={setPage}
              onSizeChange={handleSizeChange}
            />
          )}
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

      <BulkActionModal
        open={bulkAnularOpen}
        onClose={() => { setBulkAnularOpen(false); setBulkMotivo(""); }}
        title="Anular consumos"
        description="Se anularán"
        confirmLabel="Anular"
        confirmColor="red"
        count={selection.count}
        onConfirm={handleBulkAnular}
        canConfirm={bulkMotivo.trim().length > 0}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">Motivo de anulación</label>
          <Input
            value={bulkMotivo}
            onChange={(e) => setBulkMotivo(e.target.value)}
            placeholder="Ingrese el motivo..."
          />
        </div>
      </BulkActionModal>
    </div>
  );
}
