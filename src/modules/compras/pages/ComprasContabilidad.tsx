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
import { StatCard } from "@/modules/cierres/components/cierre-stat";
import {
  ArrowLeft,
  Ban,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Download,
  MoreHorizontal,
  Pencil,
  Send,
} from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable, SortableTh } from "@/components/data-table";
import { FacturasStatusFilter } from "../components/filters/FacturasStatusFilter";
import { EmitirFacturaModal } from "../components/EmitirFacturaModal";
import { AnularFacturaModal } from "../components/AnularFacturaModal";
import { PagarFacturaModal } from "../components/PagarFacturaModal";
import { toast } from "sonner";
import { useTableState } from "@/hooks/useTableState";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionModal } from "@/components/BulkActionModal";
import { handleBulkResponse } from "@/lib/bulk-utils";
import type { BulkActionResponse } from "@/domain/dto/shared/BulkActionResponse";
import { exportToXlsx, type ExportColumn } from "@/lib/exportXlsx";
import type { FacturaProveedorResponse } from "@/domain/dto/compra/FacturaProveedorResponse";
import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";
import {
  ListFilters,
  defaultFilters,
  type ListFilterState,
} from "@/components/ListFilters";

const ESTADO_STYLES: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  ANULADA: { label: "Anulada", bg: "bg-red-100", text: "text-red-600" },
  EMITIDA: { label: "Emitida", bg: "bg-blue-100", text: "text-blue-700" },
  PAGADA: { label: "Pagada", bg: "bg-emerald-100", text: "text-emerald-700" },
  PENDIENTE: { label: "Pendiente", bg: "bg-amber-100", text: "text-amber-700" },
};

export default function ComprasContabilidad() {
  const navigate = useNavigate();
  const { get, post, patch, del } = useApi();

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
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);

  const [listFilters, setListFilters] = useState<ListFilterState>(defaultFilters);

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
        .then((data: FacturaProveedorResponse[]) =>
          setFacturas(Array.isArray(data) ? data : []),
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

  const posNameById = useMemo(() => {
    const map: Record<number, string> = {};
    for (const c of comedores) {
      for (const pv of c.puntosDeVenta ?? []) {
        map[pv.id] = pv.nombre;
      }
    }
    return map;
  }, [comedores]);

  const facturasAfterDateFilter = useMemo(() => {
    let list = [...facturas];
    if (listFilters.desde) list = list.filter((f) => f.fechaFactura >= listFilters.desde);
    if (listFilters.hasta) list = list.filter((f) => f.fechaFactura <= listFilters.hasta);
    if (listFilters.comedorId) list = list.filter((f) => f.comedorId === Number(listFilters.comedorId));
    return list;
  }, [facturas, listFilters]);

  const { displayed, sort, expansion, filters } = useTableState(facturasAfterDateFilter, {
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

  const selection = useRowSelection();

  const [bulkEmitir, setBulkEmitir] = useState(false);
  const [bulkPagar, setBulkPagar] = useState(false);
  const [bulkAnular, setBulkAnular] = useState(false);
  const [bulkFechaEmision, setBulkFechaEmision] = useState("");
  const [bulkFechaPago, setBulkFechaPago] = useState("");
  const [bulkNumeroOp, setBulkNumeroOp] = useState("");
  const [bulkMotivo, setBulkMotivo] = useState("");

  const selectedFacturas = displayed.filter((f) => selection.selected.has(f.id));
  const allPendiente = selectedFacturas.length > 0 && selectedFacturas.every((f) => f.estado === "PENDIENTE");
  const allEmitida = selectedFacturas.length > 0 && selectedFacturas.every((f) => f.estado === "EMITIDA");
  const allAnulable = selectedFacturas.length > 0 && selectedFacturas.every((f) => f.estado === "PENDIENTE" || f.estado === "EMITIDA");

  const selectableIds = displayed
    .filter((f) => f.estado !== "ANULADA" && f.estado !== "PAGADA")
    .map((f) => f.id);

  const totalActivos = facturas.filter((f) => f.estado !== "ANULADA").length;
  const totalAnulados = facturas.filter((f) => f.estado === "ANULADA").length;
  const montoTotal = facturas
    .filter((f) => f.estado !== "ANULADA")
    .reduce((s, f) => s + (f.monto ?? 0), 0);
  const montoActivo = facturas
    .filter((f) => f.estado !== "ANULADA")
    .reduce((s, f) => s + (f.monto ?? 0), 0);
  const isFiltered = listFilters.desde !== "" || listFilters.hasta !== "" || listFilters.comedorId !== "";
  const montoFiltrado = displayed.reduce((s, f) => s + (f.monto ?? 0), 0);

  const refetchFacturas = () => {
    get("/facturas/proveedor")
      .then((r) => r.json())
      .then((data: FacturaProveedorResponse[]) =>
        setFacturas(Array.isArray(data) ? data : []),
      );
  };

  const handleBulkEmitir = async () => {
    const res = await post("/facturas/proveedor/bulk/emitir", {
      ids: [...selection.selected],
      fechaEmision: bulkFechaEmision || null,
      fechaPago: bulkFechaPago || null,
      numeroOperacion: bulkNumeroOp || null,
    }).then((r) => r.json() as Promise<BulkActionResponse>);
    handleBulkResponse(res, "Emisión");
    selection.clear();
    refetchFacturas();
    setBulkFechaEmision("");
    setBulkFechaPago("");
    setBulkNumeroOp("");
  };

  const handleBulkPagar = async () => {
    const res = await post("/facturas/proveedor/bulk/pagar", {
      ids: [...selection.selected],
      fechaPago: bulkFechaPago || null,
      numeroOperacion: bulkNumeroOp || null,
    }).then((r) => r.json() as Promise<BulkActionResponse>);
    handleBulkResponse(res, "Pago");
    selection.clear();
    refetchFacturas();
    setBulkFechaPago("");
    setBulkNumeroOp("");
  };

  const handleBulkAnular = async () => {
    const res = await post("/facturas/proveedor/bulk/anular", {
      ids: [...selection.selected],
      motivo: bulkMotivo,
    }).then((r) => r.json() as Promise<BulkActionResponse>);
    handleBulkResponse(res, "Anulación");
    selection.clear();
    refetchFacturas();
    setBulkMotivo("");
  };

  const exportColumns: ExportColumn<FacturaProveedorResponse>[] = [
    { key: "creadoEn", header: "Fecha de Carga" },
    { key: "id", header: "ID" },
    { key: "numero", header: "Nº Factura" },
    { key: (f) => proveedorNameById[f.proveedorId] ?? f.proveedorId, header: "Proveedor" },
    { key: (f) => comedorNameById[f.comedorId] ?? f.comedorId, header: "Comedor" },
    { key: "fechaFactura", header: "Fecha Factura" },
    { key: "monto", header: "Monto" },
    { key: "estado", header: "Estado" },
    { key: "medioPago", header: "Medio de Pago" },
    { key: "fechaEmision", header: "Fecha Emisión" },
    { key: "fechaPago", header: "Fecha Pago" },
    { key: "numeroOperacion", header: "Nº Operación" },
    { key: "bancoNombre", header: "Banco" },
    { key: "comentarios", header: "Comentarios" },
    { key: (f) => (f.puntoDeVentaComedor ?? []).map((s) => `${posNameById[s.puntoDeVentaId] ?? `Punto de venta #${s.puntoDeVentaId}`}: $${s.monto}`).join(", "), header: "Puntos de Venta" },
    { key: "creadoPorNombre", header: "Creado por" },
  ];

  const handleExport = () => {
    const data = selection.count > 0
      ? displayed.filter((f) => selection.selected.has(f.id))
      : displayed;
    const segments = ["compras"];
    if (filters.status !== "all") segments.push(filters.status);
    if (listFilters.comedorId) segments.push(`comedor-${listFilters.comedorId}`);
    if (listFilters.desde) segments.push(`desde-${listFilters.desde}`);
    if (listFilters.hasta) segments.push(`hasta-${listFilters.hasta}`);
    exportToXlsx({ data, columns: exportColumns, filename: segments.join("-") });
  };

  return (
    <div className="px-4 sm:px-8 lg:px-18 py-8">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/contabilidad")}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>

      <div className="mx-auto max-w-7xl grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 pb-4">
        <StatCard label="Total facturas" value={facturas.length} />
        <StatCard label="Activas" value={totalActivos} accent="emerald" />
        <StatCard label="Anuladas" value={totalAnulados} accent="red" />
        <StatCard label="Monto total" value={fmtCurrency(montoTotal)} />
        <StatCard
          label={isFiltered ? "Monto filtrado" : "Monto activo"}
          value={fmtCurrency(isFiltered ? montoFiltrado : montoActivo)}
          accent={isFiltered ? "blue" : undefined}
        />
      </div>

      <Card className="mx-auto max-w-7xl py-6 border-0 shadow-md rounded-xl">
        <CardHeader className="border-b px-6 py-4">
          <div className="w-full flex flex-row justify-between">
            <CardTitle className="text-xl font-bold text-gray-800">
              Facturas de Compras
            </CardTitle>
          </div>
          <div className="pt-3">
            <ListFilters filters={listFilters} onChange={setListFilters} comedores={comedores} showSociedad={false} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            displayedCount={displayed.length}
            selectionToolbar={
              selection.count > 0 ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-blue-700">
                    {selection.count} seleccionada{selection.count !== 1 ? "s" : ""}
                  </span>
                  {allPendiente && (
                    <Button size="sm" variant="outline" className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => setBulkEmitir(true)}>
                      <Send className="h-3.5 w-3.5" /> Emitir
                    </Button>
                  )}
                  {allEmitida && (
                    <Button size="sm" variant="outline" className="gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => setBulkPagar(true)}>
                      <CircleDollarSign className="h-3.5 w-3.5" /> Pagar
                    </Button>
                  )}
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
                  col="fechaEmision"
                  {...sortProps}
                />
                <SortableTh
                  label="Fecha Pago"
                  col="fechaPago"
                  {...sortProps}
                />
                <SortableTh label="Estado" col="estado" {...sortProps} />
                <th className="px-4 py-3 w-12">Acciones</th>
              </>
            }
            rows={
              <>
                {displayed.map((factura) => {
                  const isExpanded = expansion.expandedRows.has(factura.id);
                  const isAnulada = factura.estado === "ANULADA";
                  const styles = ESTADO_STYLES[factura.estado];
                  const proveedor = proveedorNameById[factura.proveedorId];
                  const comedor = comedorNameById[factura.comedorId];
                  const posSplits = factura.puntoDeVentaComedor ?? [];

                  return (
                    <Fragment key={factura.id}>
                      <tr
                        className={cn(
                          "border-b transition-colors",
                          isAnulada
                            ? "bg-red-50/30 text-gray-400"
                            : "hover:bg-gray-50/80",
                          selection.selected.has(factura.id) && "bg-blue-50/40",
                        )}
                      >
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selection.selected.has(factura.id)}
                            onChange={() => selection.toggle(factura.id)}
                            disabled={isAnulada || factura.estado === "PAGADA"}
                            className="h-4 w-4 rounded border-gray-300 disabled:opacity-30"
                          />
                        </td>
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
                        <td className="px-4 py-4 font-medium whitespace-nowrap cursor-pointer" onClick={() => expansion.toggleRow(factura.id)}>
                          {factura.numero}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap cursor-pointer" onClick={() => expansion.toggleRow(factura.id)}>
                          {factura.fechaFactura}
                        </td>
                        <td className="px-4 py-4 cursor-pointer" onClick={() => expansion.toggleRow(factura.id)}>
                          {proveedor || factura.proveedorId}
                        </td>
                        <td className="px-4 py-4 cursor-pointer" onClick={() => expansion.toggleRow(factura.id)}>
                          {comedor || factura.comedorId}
                        </td>
                        <td className="px-4 py-4 text-right font-mono cursor-pointer" onClick={() => expansion.toggleRow(factura.id)}>
                          {fmtCurrency(factura.monto)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap cursor-pointer" onClick={() => expansion.toggleRow(factura.id)}>
                          {factura.fechaEmision || (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap cursor-pointer" onClick={() => expansion.toggleRow(factura.id)}>
                          {factura.fechaPago || (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 cursor-pointer" onClick={() => expansion.toggleRow(factura.id)}>
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

                      {isExpanded && (
                        <tr className="bg-gray-50/60">
                          <td colSpan={11} className="px-8 py-4">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 lg:grid-cols-4 mb-3">
                              {factura.numeroOperacion && (
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Nº Operación</span>
                                  <span className="text-sm text-gray-700">{factura.numeroOperacion}</span>
                                </div>
                              )}
                              {factura.bancoNombre && (
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Banco</span>
                                  <span className="text-sm text-gray-700">{factura.bancoNombre}</span>
                                </div>
                              )}
                              {factura.medioPago && (
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Medio de Pago</span>
                                  <span className="text-sm text-gray-700">{factura.medioPago}</span>
                                </div>
                              )}
                              {factura.comentarios && (
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Comentarios</span>
                                  <span className="text-sm text-gray-700">{factura.comentarios}</span>
                                </div>
                              )}
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Creado por</span>
                                <span className="text-sm text-gray-700">{factura.creadoPorNombre}</span>
                              </div>
                            </div>

                            {posSplits.length > 0 && (
                              <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="bg-gray-100 text-left text-xs uppercase text-gray-500 tracking-wider">
                                      <th className="px-4 py-2.5">Punto de Venta</th>
                                      <th className="px-4 py-2.5 text-right">Monto</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {posSplits.map((split) => (
                                      <tr key={split.puntoDeVentaId} className="hover:bg-white transition-colors">
                                        <td className="px-4 py-2.5 text-gray-700">
                                          {posNameById[split.puntoDeVentaId] ?? `Punto de venta #${split.puntoDeVentaId}`}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-mono text-gray-700">
                                          {fmtCurrency(split.monto)}
                                        </td>
                                      </tr>
                                    ))}
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

      <BulkActionModal
        open={bulkEmitir}
        onClose={() => setBulkEmitir(false)}
        title="Emitir facturas"
        description="Se emitirán"
        confirmLabel="Emitir"
        confirmColor="blue"
        count={selection.count}
        onConfirm={handleBulkEmitir}
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Fecha emisión</label>
            <Input type="date" value={bulkFechaEmision} onChange={(e) => setBulkFechaEmision(e.target.value)} className="bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Fecha pago</label>
            <Input type="date" value={bulkFechaPago} onChange={(e) => setBulkFechaPago(e.target.value)} className="bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Nº operación</label>
            <Input value={bulkNumeroOp} onChange={(e) => setBulkNumeroOp(e.target.value)} className="bg-card" placeholder="Opcional" />
          </div>
        </div>
      </BulkActionModal>

      <BulkActionModal
        open={bulkPagar}
        onClose={() => setBulkPagar(false)}
        title="Pagar facturas"
        description="Se registrará el pago de"
        confirmLabel="Pagar"
        confirmColor="emerald"
        count={selection.count}
        onConfirm={handleBulkPagar}
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Fecha pago</label>
            <Input type="date" value={bulkFechaPago} onChange={(e) => setBulkFechaPago(e.target.value)} className="bg-card" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Nº operación</label>
            <Input value={bulkNumeroOp} onChange={(e) => setBulkNumeroOp(e.target.value)} className="bg-card" placeholder="Opcional" />
          </div>
        </div>
      </BulkActionModal>

      <BulkActionModal
        open={bulkAnular}
        onClose={() => setBulkAnular(false)}
        title="Anular facturas"
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
