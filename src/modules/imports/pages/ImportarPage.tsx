import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import { IMPORT_TYPES } from "../config/importTypes";
import type { ImportJob } from "../config/sharedTypes";

const ESTADO_JOB_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  PENDIENTE: { label: "Pendiente", bg: "bg-amber-100", text: "text-amber-700" },
  PROCESANDO: { label: "Procesando", bg: "bg-blue-100", text: "text-blue-700" },
  COMPLETADO: { label: "Completado", bg: "bg-emerald-100", text: "text-emerald-700" },
};

const typeOptions = IMPORT_TYPES.map((t) => ({ value: t.key, label: t.label }));

export default function ImportarPage() {
  const navigate = useNavigate();
  const { get, postFile } = useApi();

  const [selectedType, setSelectedType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [jobsResult, setJobsResult] = useState<{ forType: string | null; jobs: ImportJob[] }>({ forType: null, jobs: [] });
  const fileRef = useRef<HTMLInputElement>(null);

  const importType = IMPORT_TYPES.find((t) => t.key === selectedType);
  const loadingJobs = importType != null && jobsResult.forType !== importType.key;
  const jobs = jobsResult.forType === (importType?.key ?? null) ? jobsResult.jobs : [];

  useEffect(() => {
    if (!importType) {
      setJobsResult({ forType: null, jobs: [] });
      return;
    }
    get(`${importType.endpoint}/jobs`)
      .then((r) => r.json())
      .then((data) => setJobsResult({ forType: importType.key, jobs: Array.isArray(data) ? data : [] }));
  }, [get, importType]);

  const handleUpload = async () => {
    if (!file || !importType) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await postFile(importType.endpoint, form);
      const job = (await res.json()) as ImportJob;
      toast("Archivo subido", { description: `Job #${job.id} creado.` });
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      navigate(`/contabilidad/importar/${selectedType}/${job.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo subir el archivo. Verificá el formato.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="px-4 sm:px-8 lg:px-18 py-8">
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/contabilidad")}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>

      <Card className="mx-auto max-w-5xl mt-4 border-0 shadow-md rounded-xl">
        <CardHeader className="border-b px-6 py-4">
          <CardTitle className="text-xl font-bold text-gray-800">Importar Excel</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tipo de importación *</label>
            <Combobox
              options={typeOptions}
              value={selectedType}
              onChange={(v) => {
                setSelectedType(v);
                setFile(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              placeholder="Seleccionar tipo..."
            />
          </div>

          {selectedType && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Archivo Excel *</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
              </div>

              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="gap-2"
              >
                {uploading ? (
                  <>
                    <Spinner className="mr-1" /> Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> Subir
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {selectedType && (
        <Card className="mx-auto max-w-5xl mt-6 border-0 shadow-md rounded-xl">
          <CardHeader className="border-b px-6 py-4">
            <CardTitle className="text-lg font-semibold text-gray-800">
              Jobs recientes — {importType?.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingJobs ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : jobs.length === 0 ? (
              <p className="px-6 py-8 text-sm text-gray-400 text-center">
                Sin importaciones recientes
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs uppercase text-gray-500 tracking-wider">
                      <th className="px-4 py-3">Archivo</th>
                      <th className="px-3 py-3">Fecha</th>
                      <th className="px-3 py-3 text-center">Estado</th>
                      <th className="px-2 py-3 text-center">Total</th>
                      <th className="px-2 py-3 text-center">Listas</th>
                      <th className="px-2 py-3 text-center">Conflicto</th>
                      <th className="px-2 py-3 text-center">Inválidas</th>
                      <th className="px-2 py-3 text-center">Aplicadas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {jobs.map((job) => {
                      const st = ESTADO_JOB_STYLES[job.estado] ?? ESTADO_JOB_STYLES.PENDIENTE;
                      return (
                        <tr
                          key={job.id}
                          className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                          onClick={() =>
                            navigate(`/contabilidad/importar/${selectedType}/${job.id}`)
                          }
                        >
                          <td className="px-4 py-3 font-medium truncate max-w-[200px]">
                            {job.nombreArchivo ?? `Job #${job.id}`}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-gray-600">
                            {job.creadoEn?.split("T")[0] ?? "—"}
                          </td>
                          <td className="px-3 py-3 text-center">
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
                          <td className="px-2 py-3 text-center font-mono">{job.totalFilas}</td>
                          <td className="px-2 py-3 text-center font-mono text-emerald-600">
                            {job.filasListas}
                          </td>
                          <td className="px-2 py-3 text-center font-mono text-amber-600">
                            {job.filasConflicto}
                          </td>
                          <td className="px-2 py-3 text-center font-mono text-red-600">
                            {job.filasInvalidas}
                          </td>
                          <td className="px-2 py-3 text-center font-mono text-blue-600">
                            {job.filasAplicadas}
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
      )}
    </div>
  );
}
