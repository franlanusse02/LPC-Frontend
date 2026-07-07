import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import { getImportType } from "../config/importTypes";
import type { ImportJob, ImportRow } from "../config/sharedTypes";
import type { EstadoFila } from "@/domain/enums/EstadoFila";

const ESTADO_FILA_STYLES: Record<EstadoFila, { label: string; bg: string; text: string }> = {
  READY: { label: "Lista", bg: "bg-emerald-100", text: "text-emerald-700" },
  INVALID: { label: "Inválida", bg: "bg-red-100", text: "text-red-600" },
  CONFLICT: { label: "Conflicto", bg: "bg-amber-100", text: "text-amber-700" },
  APPLIED: { label: "Aplicada", bg: "bg-blue-100", text: "text-blue-700" },
};

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "READY", label: "Listas" },
  { value: "CONFLICT", label: "Conflicto" },
  { value: "INVALID", label: "Inválidas" },
  { value: "APPLIED", label: "Aplicadas" },
];

export default function ImportJobPage() {
  const navigate = useNavigate();
  const { type, jobId } = useParams<{ type: string; jobId: string }>();
  const { get, post, del } = useApi();

  const importType = getImportType(type ?? "");
  const basePath = importType ? `${importType.endpoint}/jobs/${jobId}` : "";

  const [job, setJob] = useState<ImportJob | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [estadoFilter, setEstadoFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchJob = () => {
    if (!basePath) return;
    get(basePath)
      .then((r) => r.json())
      .then(setJob);
  };

  const fetchRows = () => {
    if (!basePath) return;
    const qs = estadoFilter !== "all" ? `?estado=${estadoFilter}` : "";
    get(`${basePath}/rows${qs}`)
      .then((r) => r.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!basePath) return;

    get(basePath)
      .then((r) => r.json())
      .then(setJob);

    const qs = estadoFilter !== "all" ? `?estado=${estadoFilter}` : "";
    get(`${basePath}/rows${qs}`)
      .then((r) => r.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [get, basePath, estadoFilter]);

  const handleApplyAll = async () => {
    setApplying(true);
    try {
      await post(`${basePath}/apply-ready`, {});
      toast("Aplicación completada");
      fetchJob();
      fetchRows();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudieron aplicar las filas.");
    } finally {
      setApplying(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await post(`${basePath}/cancel`, {});
      toast("Job cancelado");
      fetchJob();
      fetchRows();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cancelar la importación.");
    } finally {
      setCancelling(false);
    }
  };

  const handleApplyRow = async (rowId: number) => {
    try {
      await post(`${basePath}/rows/${rowId}/apply`, {});
      toast("Fila aplicada");
      fetchJob();
      fetchRows();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo aplicar esta fila.");
    }
  };

  const handleDeleteRow = async (rowId: number) => {
    try {
      await del(`${basePath}/rows/${rowId}`);
      toast("Fila eliminada");
      fetchJob();
      fetchRows();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar la fila.");
    }
  };

  const handleRevalidate = async (rowId: number) => {
    try {
      await post(`${basePath}/rows/${rowId}/revalidar`, {});
      toast("Fila revalidada");
      fetchRows();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo revalidar la fila.");
    }
  };

  if (!importType) {
    return (
      <div className="px-4 sm:px-8 lg:px-18 py-8">
        <div className="max-w-4xl mx-auto text-center text-gray-500 py-20">
          Tipo de importación no encontrado.
        </div>
      </div>
    );
  }

  const isJobDone = job?.estado === "COMPLETADO";
  const columns = importType.columns;

  return (
    <div className="px-4 sm:px-8 lg:px-18 py-8">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/contabilidad/importar")}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a importaciones
        </Button>
      </div>

      {job && (
        <Card className="mx-auto max-w-7xl mt-4 border-0 shadow-md rounded-xl">
          <CardHeader className="border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-gray-800">
                  {job.nombreArchivo ?? `Job #${job.id}`}
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {importType.label} — {job.creadoEn?.split("T")[0]}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!isJobDone && (
                  <>
                    <Button
                      size="sm"
                      onClick={handleApplyAll}
                      disabled={applying || job.filasListas === 0}
                      className="gap-1.5"
                    >
                      {applying ? <Spinner className="mr-1" /> : <Check className="h-4 w-4" />}
                      Aplicar listas ({job.filasListas})
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="gap-1.5"
                    >
                      {cancelling ? <Spinner className="mr-1" /> : <X className="h-4 w-4" />}
                      Cancelar job
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <StatPill label="Total" value={job.totalFilas} />
              <StatPill label="Listas" value={job.filasListas} accent="emerald" />
              <StatPill label="Conflicto" value={job.filasConflicto} accent="amber" />
              <StatPill label="Inválidas" value={job.filasInvalidas} accent="red" />
              <StatPill label="Aplicadas" value={job.filasAplicadas} accent="blue" />
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mx-auto max-w-7xl mt-4 border-0 shadow-md rounded-xl">
        <CardHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-2">
            {FILTER_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                size="sm"
                variant={estadoFilter === opt.value ? "default" : "outline"}
                onClick={() => {
                  setLoading(true);
                  setEstadoFilter(opt.value);
                }}
                className="text-xs"
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : rows.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-400 text-center">
              Sin filas para mostrar
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500 tracking-wider">
                    <th className="px-4 py-3">#</th>
                    {columns.map((col) => (
                      <th key={col.key} className="px-4 py-3">
                        {col.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3">Errores</th>
                    <th className="px-4 py-3 w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row) => {
                    const st = ESTADO_FILA_STYLES[row.estado];
                    const isApplied = row.estado === "APPLIED";

                    return (
                      <tr
                        key={row.id}
                        className={cn(
                          "transition-colors",
                          isApplied ? "bg-blue-50/30 text-gray-400" : "hover:bg-gray-50/80",
                        )}
                      >
                        <td className="px-4 py-3 font-mono text-gray-400">
                          {row.rowIndex}
                        </td>
                        {columns.map((col) => (
                          <td key={col.key} className="px-4 py-3 text-gray-700 max-w-[180px] truncate">
                            {row[col.key] != null ? String(row[col.key]) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                              st.bg,
                              st.text,
                            )}
                          >
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-red-500 max-w-[200px] truncate">
                          {row.errors || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {!isApplied && (
                            <div className="flex items-center gap-1">
                              {row.estado === "READY" && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  onClick={() => handleApplyRow(row.id)}
                                  title="Aplicar"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {(row.estado === "INVALID" || row.estado === "CONFLICT") && (
                                <>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={() => handleRevalidate(row.id)}
                                    title="Revalidar"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => handleDeleteRow(row.id)}
                                    title="Eliminar"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "emerald" | "amber" | "red" | "blue";
}) {
  const colors = {
    emerald: "text-emerald-700 bg-emerald-50 border-emerald-200",
    amber: "text-amber-700 bg-amber-50 border-amber-200",
    red: "text-red-600 bg-red-50 border-red-200",
    blue: "text-blue-700 bg-blue-50 border-blue-200",
  };

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 text-center",
        accent ? colors[accent] : "border-gray-200 bg-gray-50 text-gray-700",
      )}
    >
      <div className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}
