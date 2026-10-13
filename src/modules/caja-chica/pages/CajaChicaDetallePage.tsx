import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Ban, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Spinner } from "@/components/ui/spinner";
import { DataTable } from "@/components/data-table";
import { Pagination } from "@/components/Pagination";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { decodeJwtSub } from "@/lib/auth-utils";
import type { CajaChicaResponse } from "@/domain/dto/caja-chica/CajaChicaResponse";
import type { ConceptoCajaChicaResponse } from "@/domain/dto/caja-chica/ConceptoCajaChica";
import type {
  CreateMovimientoCajaChicaRequest,
  MovimientoCajaChicaPage,
  MovimientoCajaChicaResponse,
} from "@/domain/dto/caja-chica/MovimientoCajaChica";
import { MovimientoCajaChicaForm } from "../components/MovimientoCajaChicaForm";
import { formatMonto, perteneceA } from "../format";

type Filtros = {
  desde: string;
  hasta: string;
  tipo: string;
  conceptoId: string;
  incluirAnulados: boolean;
};

const FILTROS_VACIOS: Filtros = {
  desde: "",
  hasta: "",
  tipo: "",
  conceptoId: "",
  incluirAnulados: false,
};

const formatFecha = (iso: string) => iso.split("-").reverse().join("/");

export default function CajaChicaDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { get, post, patch } = useApi();
  const isAdmin = session?.rol === "ADMIN";
  const usuarioId = session ? decodeJwtSub(session.token) : null;

  const [caja, setCaja] = useState<CajaChicaResponse | null>(null);
  const [noEncontrada, setNoEncontrada] = useState(false);
  const [conceptos, setConceptos] = useState<ConceptoCajaChicaResponse[]>([]);
  const [pageData, setPageData] = useState<MovimientoCajaChicaPage | null>(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(50);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIOS);
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [anulando, setAnulando] = useState<MovimientoCajaChicaResponse | null>(null);
  const [motivo, setMotivo] = useState("");
  const [savingAnular, setSavingAnular] = useState(false);

  const cargarCaja = useCallback(
    () =>
      get(`/cajas-chicas/${id}`)
        .then((r) => r.json())
        .then(setCaja)
        .catch(() => setNoEncontrada(true)),
    [get, id],
  );

  const cargarMovimientos = useCallback(() => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
      incluirAnulados: String(filtros.incluirAnulados),
    });
    if (filtros.desde) params.set("desde", filtros.desde);
    if (filtros.hasta) params.set("hasta", filtros.hasta);
    if (filtros.tipo) params.set("tipo", filtros.tipo);
    if (filtros.conceptoId) params.set("conceptoId", filtros.conceptoId);
    return get(`/cajas-chicas/${id}/movimientos?${params}`)
      .then((r) => r.json())
      .then(setPageData)
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : "No se pudieron cargar los movimientos."),
      );
  }, [get, id, page, size, filtros]);

  useEffect(() => {
    cargarCaja();
    get("/cajas-chicas/conceptos")
      .then((r) => r.json())
      .then(setConceptos);
  }, [cargarCaja, get]);

  useEffect(() => {
    cargarMovimientos();
  }, [cargarMovimientos]);

  const setFiltro = <K extends keyof Filtros>(key: K, value: Filtros[K]) => {
    setFiltros((f) => ({ ...f, [key]: value }));
    setPage(0);
  };

  const handleNuevo = async (body: CreateMovimientoCajaChicaRequest) => {
    await post(`/cajas-chicas/${id}/movimientos`, body);
    toast.success(body.tipo === "INGRESO" ? "Ingreso cargado" : "Egreso cargado");
    setNuevoOpen(false);
    await Promise.all([cargarCaja(), cargarMovimientos()]);
  };

  const handleAnular = async () => {
    if (!anulando) return;
    if (!motivo.trim()) {
      toast.error("Poné el motivo.");
      return;
    }
    setSavingAnular(true);
    try {
      await patch(`/cajas-chicas/movimientos/${anulando.id}/anular`, { motivo: motivo.trim() });
      toast.success("Movimiento anulado");
      setAnulando(null);
      await Promise.all([cargarCaja(), cargarMovimientos()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo anular el movimiento.");
    } finally {
      setSavingAnular(false);
    }
  };

  const puedeAnular = (m: MovimientoCajaChicaResponse) =>
    !m.anulado && (isAdmin || m.creadoPorId === usuarioId);

  if (noEncontrada)
    return (
      <div className="px-4 py-16 text-center text-sm text-gray-500">
        No se encontró la caja chica o no tenés acceso.
        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate("/caja-chica")}>
            Ver mis cajas
          </Button>
        </div>
      </div>
    );

  if (caja === null)
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );

  return (
    <div className="px-4 sm:px-8 lg:px-18 py-8">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/caja-chica")}>
          <ArrowLeft className="h-4 w-4" /> Cajas chicas
        </Button>
      </div>

      <Card className="mx-auto max-w-7xl border-0 shadow-md mt-4">
        <CardHeader className="border-b px-6 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4 w-full">
            <CardTitle className="tracking-wide">
              <h1 className="text-xl font-bold text-gray-800 uppercase">{caja.nombre}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {perteneceA(caja)}
                {!caja.activa && " · Cerrada"}
              </p>
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs uppercase text-gray-500">Saldo</p>
                <p
                  className={`text-2xl font-bold font-mono tabular-nums ${
                    caja.saldo < 0 ? "text-red-600" : "text-gray-800"
                  }`}
                >
                  {formatMonto(caja.saldo)}
                </p>
              </div>
              {caja.activa && (
                <Button size="sm" onClick={() => setNuevoOpen(true)} className="gap-2 font-bold">
                  <Plus className="h-4 w-4" /> MOVIMIENTO
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <div className="flex flex-wrap items-end gap-3 border-b px-6 py-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Desde</label>
            <Input
              type="date"
              value={filtros.desde}
              onChange={(e) => setFiltro("desde", e.target.value)}
              className="w-40"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Hasta</label>
            <Input
              type="date"
              value={filtros.hasta}
              onChange={(e) => setFiltro("hasta", e.target.value)}
              className="w-40"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Tipo</label>
            <Combobox
              options={[
                { value: "INGRESO", label: "Ingresos" },
                { value: "EGRESO", label: "Egresos" },
              ]}
              value={filtros.tipo}
              onChange={(v) => setFiltro("tipo", v)}
              placeholder="Todos"
              clearable
              className="w-36"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Concepto</label>
            <Combobox
              options={conceptos.map((c) => ({ value: String(c.id), label: c.nombre }))}
              value={filtros.conceptoId}
              onChange={(v) => setFiltro("conceptoId", v)}
              placeholder="Todos"
              clearable
              className="w-48"
            />
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={filtros.incluirAnulados}
              onChange={(e) => setFiltro("incluirAnulados", e.target.checked)}
            />
            Ver anulados
          </label>
        </div>

        <CardContent className="p-0">
          {pageData === null ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : pageData.content.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-gray-400">Sin movimientos.</p>
          ) : (
            <DataTable
              displayedCount={pageData.content.length}
              columns={
                <>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500 w-28">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Concepto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Detalle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Cargó
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-gray-500">
                    Monto
                  </th>
                  <th className="px-4 py-3 w-14" />
                </>
              }
              rows={pageData.content.map((m) => (
                <tr
                  key={m.id}
                  className={`border-b ${m.anulado ? "bg-gray-50 text-gray-400" : "hover:bg-gray-50/60"}`}
                >
                  <td className="px-6 py-3 text-sm whitespace-nowrap">{formatFecha(m.fecha)}</td>
                  <td className="px-6 py-3 text-sm font-medium">{m.conceptoNombre}</td>
                  <td className="px-6 py-3 text-sm">
                    {m.detalle}
                    {m.anulado && (
                      <p className="text-xs">
                        Anulado por {m.anuladoPorNombre}: {m.motivoAnulacion}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-3 text-sm">{m.creadoPorNombre}</td>
                  <td
                    className={`px-6 py-3 text-right font-mono tabular-nums whitespace-nowrap ${
                      m.anulado
                        ? "line-through"
                        : m.tipo === "INGRESO"
                          ? "text-green-700"
                          : "text-red-600"
                    }`}
                  >
                    {m.tipo === "INGRESO" ? "+" : "−"}
                    {formatMonto(m.monto)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {puedeAnular(m) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        title="Anular"
                        onClick={() => {
                          setAnulando(m);
                          setMotivo("");
                        }}
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            ></DataTable>
          )}
          {pageData && pageData.totalElements > 0 && (
            <Pagination
              page={pageData.number}
              size={size}
              totalPages={pageData.totalPages}
              totalElements={pageData.totalElements}
              onPageChange={setPage}
              onSizeChange={(s) => {
                setSize(s);
                setPage(0);
              }}
            />
          )}
        </CardContent>
      </Card>

      {nuevoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">Nuevo movimiento</h2>
            <p className="mb-4 text-sm text-gray-500">{caja.nombre}</p>
            <MovimientoCajaChicaForm
              conceptos={conceptos}
              onSubmit={handleNuevo}
              onCancel={() => setNuevoOpen(false)}
            />
          </div>
        </div>
      )}

      {anulando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">Anular movimiento</h2>
            <p className="mb-4 text-sm text-gray-500">
              {anulando.tipo === "INGRESO" ? "Ingreso" : "Egreso"} de {formatMonto(anulando.monto)}{" "}
              del {formatFecha(anulando.fecha)} ({anulando.conceptoNombre}). Deja de contar en el
              saldo.
            </p>
            <label className="mb-1 block text-sm font-medium">Motivo</label>
            <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} autoFocus />
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setAnulando(null)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleAnular} disabled={savingAnular}>
                {savingAnular ? <Spinner className="h-4 w-4" /> : "Anular"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
