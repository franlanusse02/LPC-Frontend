import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi } from "@/hooks/useApi";
import { cn, fmtCurrency } from "@/lib/utils";
import { ArrowLeft, Ban, ChevronDown, ChevronUp, Download, MoreHorizontal, Pencil, Plus } from "lucide-react";
import { Fragment, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DetailedCierreCajaResponse } from "@/domain/dto/cierre-caja/CierreCajaResponse";
import type { CierreCajaStatsResponse } from "@/domain/dto/cierre-caja/CierreCajaStatsResponse";
import type { MovimientoResponse } from "@/domain/dto/movimiento/MovimientoResponse";
import type { Page } from "@/domain/dto/shared/Page";
import { DataTable, SortableTh } from "@/components/data-table";
import { Pagination } from "@/components/Pagination";
import { MovimientoRow, AnuladosGroup } from "../components/MovimientoRow";
import { CierresStatusFilter } from "../components/filters/CierresStatusFilter";
import { exportToXlsx, type ExportColumn } from "@/lib/exportXlsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AnularCierreModal } from "../components/AnularCierreModal";
import { useExpandableRows } from "@/hooks/useExpandableRows";
import { StatCard } from "../components/CierreStat";
import { ListFilters, type ListFilterState } from "@/components/ListFilters";
import { defaultFilters } from "@/components/list-filter-defaults";
import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";
import { buildQuery } from "@/lib/query-string";

type StatusFilter = "all" | "active" | "anulado";

export default function CierresPage() {
  const navigate = useNavigate();
  const { get, del } = useApi();

  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [listFilters, setListFiltersRaw] = useState<ListFilterState>({ ...defaultFilters, dateField: "fechaOperacion" });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [sortKey, setSortKey] = useState("fechaOperacion");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [pageData, setPageData] = useState<Page<DetailedCierreCajaResponse> | null>(null);
  const [stats, setStats] = useState<CierreCajaStatsResponse | null>(null);

  const cierres = pageData?.content ?? [];

  const [anularModalOpen, setAnularModalOpen] = useState(false);
  const [selectedCierre, setSelectedCierre] =
    useState<DetailedCierreCajaResponse | null>(null);

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
      puntoDeVentaIds: listFilters.puntoDeVentaIds,
      anulado: statusFilter === "all" ? undefined : statusFilter === "anulado",
      fechaInicio: listFilters.desde,
      fechaFin: listFilters.hasta,
      page,
      size,
      sort: `${sortKey},${sortDir}`,
    });
    return get(`/cierres/mine${qs}`).then((r) => r.json()).then(setPageData);
  }, [get, listFilters.comedorId, listFilters.puntoDeVentaIds, listFilters.desde, listFilters.hasta, statusFilter, page, size, sortKey, sortDir]);

  const fetchStats = useCallback(() => {
    const qs = buildQuery({
      comedorId: listFilters.comedorId || undefined,
      puntoDeVentaIds: listFilters.puntoDeVentaIds,
      fechaInicio: listFilters.desde,
      fechaFin: listFilters.hasta,
    });
    return get(`/cierres/mine/stats${qs}`).then((r) => r.json()).then(setStats);
  }, [get, listFilters.comedorId, listFilters.puntoDeVentaIds, listFilters.desde, listFilters.hasta]);

  useEffect(() => {
    get("/comedores").then((r) => r.json()).then(setComedores);
  }, [get]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const sortProps = {
    sortKey,
    sortDir,
    onSort: handleSort,
  };

  const expansion = useExpandableRows();

  const handleAnular = async (id: number, motivo: string) => {
    await del(`/cierres/${id}`, { body: JSON.stringify({ motivo }) });
    setSelectedCierre(null);
    setAnularModalOpen(false);
    fetchList();
    fetchStats();
  };

  const exportColumns: ExportColumn<DetailedCierreCajaResponse>[] = [
    { key: "fechaOperacion", header: "Fecha" },
    { key: (c) => c.comedor.nombre, header: "Comedor" },
    { key: (c) => c.puntoDeVenta.nombre, header: "Punto de Venta" },
    { key: (c) => c.creadoPor.nombre, header: "Creado por" },
    { key: "totalPlatosVendidos", header: "Platos" },
    { key: "montoTotal", header: "Monto Total" },
    { key: (c) => (c.anulacionId ? "Anulado" : "Activo"), header: "Estado" },
    { key: "comentarios", header: "Comentarios" },
  ];

  const handleExport = () => {
    const segments = ["mis-cierres"];
    if (statusFilter !== "all") segments.push(statusFilter);
    exportToXlsx({ data: cierres, columns: exportColumns, filename: segments.join("-") });
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

      <div className="mx-auto max-w-7xl grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 pb-4">
        <StatCard label="Total cierres" value={stats?.total ?? 0} />
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
          <div className="pt-3">
            <ListFilters
              filters={listFilters}
              onChange={handleFiltersChange}
              comedores={comedores}
              showSociedad={false}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            displayedCount={pageData?.numberOfElements ?? 0}
            toolbarLeft={
              <div className="flex flex-wrap items-center gap-2">
                <CierresStatusFilter
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
                <SortableTh label="Fecha" col="fechaOperacion" {...sortProps} />
                <th className="px-4 py-3">Comedor</th>
                <th className="px-4 py-3">Creado por</th>
                <th className="px-4 py-3">Punto de Venta</th>
                <SortableTh
                  label="Platos"
                  col="totalPlatosVendidos"
                  {...sortProps}
                  className="text-center"
                />
                <th className="px-4 py-3 text-right">Monto Total</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3">Comentarios</th>
                <th className="px-4 py-3 w-12" />
              </>
            }
            rows={
              <>
                {cierres.map((cierre) => {
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
                        <td className="px-4 py-4">
                          {!isAnulado && (
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
                              <DropdownMenuContent
                                align="end"
                                className="w-44 rounded-xl shadow-lg border-gray-100"
                              >
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigate(`/encargado/cierres/${cierre.id}/editar`)
                                  }
                                  className="gap-2.5 cursor-pointer rounded-lg text-gray-700 focus:text-gray-900"
                                >
                                  <Pencil className="h-4 w-4 text-gray-400" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-1" />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedCierre(cierre);
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
      <AnularCierreModal
        open={anularModalOpen}
        onClose={() => setAnularModalOpen(false)}
        cierre={selectedCierre}
        onConfirm={handleAnular}
      />
    </div>
  );
}
