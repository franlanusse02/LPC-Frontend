import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi } from "@/hooks/useApi";
import { cn, fmtCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  Ban,
  ChevronDown,
  ChevronUp,
  Download,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { AnularCierreModal } from "@/modules/cierres/components/anular-cierre-modal";
import { useTableState } from "@/hooks/useTableState";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionModal } from "@/components/BulkActionModal";
import { handleBulkResponse } from "@/lib/bulk-utils";
import { StatCard } from "../components/cierre-stat";
import { ListFilters, defaultFilters, type ListFilterState } from "@/components/ListFilters";
import type { BulkActionResponse } from "@/domain/dto/shared/BulkActionResponse";
import { exportToXlsx, type ExportColumn } from "@/lib/exportXlsx";
import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";

export default function CierresContabilidad() {
  const navigate = useNavigate();
  const { get, post, del } = useApi();

  const [cierres, setCierres] = useState<DetailedCierreCajaResponse[]>([]);
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [listFilters, setListFilters] = useState<ListFilterState>(defaultFilters);

  const [anularCierreModalOpen, setAnularCierreModalOpen] = useState(false);
  const [selectedCierre, setSelectedCierre] =
    useState<DetailedCierreCajaResponse | null>(null);

  useEffect(() => {
    Promise.all([get("/cierres"), get("/comedores")]).then(
      ([cierresRes, comedoresRes]) => {
        cierresRes.json().then(setCierres);
        comedoresRes.json().then(setComedores);
      },
    );
  }, [get]);

  const cierresAfterFilters = useMemo(() => {
    let list = cierres;
    if (listFilters.desde) list = list.filter((c) => c.fechaOperacion >= listFilters.desde);
    if (listFilters.hasta) list = list.filter((c) => c.fechaOperacion <= listFilters.hasta);
    if (listFilters.comedorId) list = list.filter((c) => c.comedor.id === Number(listFilters.comedorId));
    if (listFilters.puntoDeVentaId) list = list.filter((c) => c.puntoDeVenta.id === Number(listFilters.puntoDeVentaId));
    return list;
  }, [cierres, listFilters]);

  const { displayed, sort, expansion, filters } = useTableState(cierresAfterFilters, {
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

  const selection = useRowSelection();

  const [bulkAnular, setBulkAnular] = useState(false);
  const [bulkMotivo, setBulkMotivo] = useState("");

  const selectedCierres = displayed.filter((c) => selection.selected.has(c.id));
  const allAnulable = selectedCierres.length > 0 && selectedCierres.every((c) => !c.anulacionId);

  const selectableIds = displayed.filter((c) => !c.anulacionId).map((c) => c.id);

  const refetchCierres = () => {
    get("/cierres").then((r) => r.json()).then(setCierres);
  };

  const handleBulkAnular = async () => {
    const res = await post("/cierres/bulk/anular", {
      ids: [...selection.selected],
      motivo: bulkMotivo,
    }).then((r) => r.json() as Promise<BulkActionResponse>);
    handleBulkResponse(res, "Anulación");
    selection.clear();
    refetchCierres();
    setBulkMotivo("");
  };

  const exportColumns: ExportColumn<DetailedCierreCajaResponse>[] = [
    { key: "createdAt", header: "Fecha de Carga" },
    { key: "id", header: "ID" },
    { key: (c) => c.comedor.nombre, header: "Comedor" },
    { key: (c) => c.puntoDeVenta.nombre, header: "Punto de Venta" },
    { key: (c) => c.creadoPor.nombre, header: "Creado por" },
    { key: "fechaOperacion", header: "Fecha Operación" },
    { key: "totalPlatosVendidos", header: "Platos Vendidos" },
    { key: "montoTotal", header: "Monto Total" },
    { key: (c) => c.anulacionId ? "Anulado" : "Activo", header: "Estado" },
    { key: "comentarios", header: "Comentarios" },
    { key: (c) => c.movimientos?.length ?? 0, header: "Movimientos" },
  ];

  const handleExport = () => {
    const data = selection.count > 0
      ? displayed.filter((c) => selection.selected.has(c.id))
      : displayed;
    const segments = ["cierres"];
    if (filters.status !== "all") segments.push(filters.status);
    if (listFilters.comedorId) {
      const name = comedores.find((c) => c.id === Number(listFilters.comedorId))?.nombre;
      if (name) segments.push(name.toLowerCase().replace(/\s+/g, "-"));
    }
    if (listFilters.desde) segments.push(`desde-${listFilters.desde}`);
    if (listFilters.hasta) segments.push(`hasta-${listFilters.hasta}`);
    exportToXlsx({ data, columns: exportColumns, filename: segments.join("-") });
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
    <div className="px-4 sm:px-8 lg:px-18 py-8">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/contabilidad")}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>

      <div className="mx-auto max-w-7xl grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 pb-4">
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

      <Card className="mx-auto max-w-7xl py-6 border-0 shadow-md rounded-xl">
        <CardHeader className="border-b px-6 py-4">
          <div className="flex flex-row justify-between">
            <CardTitle className="text-xl font-bold text-gray-800">
              Cierres
            </CardTitle>
          </div>
          <div className="pt-3">
            <ListFilters
              filters={listFilters}
              onChange={setListFilters}
              comedores={comedores}
              showSociedad={false}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            displayedCount={displayed.length}
            selectionToolbar={
              selection.count > 0 ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-blue-700">
                    {selection.count} seleccionado{selection.count !== 1 ? "s" : ""}
                  </span>
                  {allAnulable && (
                    <Button size="sm" variant="outline" className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50" onClick={() => setBulkAnular(true)}>
                      <Ban className="h-3.5 w-3.5" /> Anular
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-gray-500 text-xs" onClick={selection.clear}>
                    Deseleccionar
                  </Button>
                </div>
              ) : undefined
            }
            toolbarLeft={
              <div className="flex flex-wrap items-center gap-2">
                <CierresStatusFilter
                  value={filters.status as "all" | "active" | "anulado"}
                  onChange={filters.setStatus}
                />
              </div>
            }
            toolbarRight={
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="size-4 mr-1.5" />
                {selection.count > 0 ? `Exportar (${selection.count})` : "Exportar Excel"}
              </Button>
            }
            columns={
              <>
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={selection.isAllSelected(selectableIds)}
                    onChange={() => selection.toggleAll(selectableIds)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </th>
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
                          selection.selected.has(cierre.id) && "bg-blue-50/40",
                        )}
                      >
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selection.selected.has(cierre.id)}
                            onChange={() => selection.toggle(cierre.id)}
                            disabled={isAnulado}
                            className="h-4 w-4 rounded border-gray-300 disabled:opacity-30"
                          />
                        </td>
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
                          <td colSpan={11} className="px-8 py-4">
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

      <BulkActionModal
        open={bulkAnular}
        onClose={() => setBulkAnular(false)}
        title="Anular cierres"
        description="Se anularán"
        confirmLabel="Anular"
        confirmColor="red"
        count={selection.count}
        canConfirm={!!bulkMotivo.trim()}
        onConfirm={handleBulkAnular}
      >
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">Motivo *</label>
          <Input value={bulkMotivo} onChange={(e) => setBulkMotivo(e.target.value)} className="bg-card" placeholder="Motivo de anulación" />
        </div>
      </BulkActionModal>
    </div>
  );
}
