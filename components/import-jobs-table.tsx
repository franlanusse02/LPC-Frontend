"use client";

import { Button } from "@/components/ui/button";
import { JobStatusBadge } from "@/components/job-status-badge";
import { EstadoJob } from "@/models/enums/EstadoJob";
import { Eye, FileSpreadsheet } from "lucide-react";

type ImportJobLike = {
  id: number;
  estado: EstadoJob;
  nombreArchivo: string | null;
  totalFilas: number;
  filasListas: number;
  filasConflicto: number;
  filasInvalidas: number;
  filasAplicadas: number;
  creadoEn: string;
};

type ImportJobsTableProps<T extends ImportJobLike> = {
  jobs: T[];
  loading: boolean;
  emptyLabel: string;
  onOpenJob: (jobId: number) => void;
};

export function ImportJobsTable<T extends ImportJobLike>({
  jobs,
  loading,
  emptyLabel,
  onOpenJob,
}: ImportJobsTableProps<T>) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
        <FileSpreadsheet className="h-8 w-8 opacity-50" />
        <p className="text-sm">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100/80 text-left text-xs uppercase tracking-wider text-gray-500">
            <th className="px-4 py-3">Archivo</th>
            <th className="px-4 py-3">Creado</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3 text-center">Total</th>
            <th className="px-4 py-3 text-center">Listas</th>
            <th className="px-4 py-3 text-center">Conflicto</th>
            <th className="px-4 py-3 text-center">Inválidas</th>
            <th className="px-4 py-3 text-center">Aplicadas</th>
            <th className="px-4 py-3 w-12" />
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="border-b transition-colors hover:bg-gray-50/80">
              <td className="px-4 py-4 font-medium text-gray-800">
                {job.nombreArchivo ?? "Sin nombre"}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-gray-500">
                {new Date(job.creadoEn).toLocaleString("es-AR")}
              </td>
              <td className="px-4 py-4">
                <JobStatusBadge estado={job.estado} />
              </td>
              <td className="px-4 py-4 text-center font-mono">{job.totalFilas}</td>
              <td className="px-4 py-4 text-center font-mono text-emerald-700">{job.filasListas}</td>
              <td className="px-4 py-4 text-center font-mono text-rose-700">{job.filasConflicto}</td>
              <td className="px-4 py-4 text-center font-mono text-orange-700">{job.filasInvalidas}</td>
              <td className="px-4 py-4 text-center font-mono text-sky-700">{job.filasAplicadas}</td>
              <td className="px-4 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenJob(job.id)}
                  className="gap-2 border-gray-200 text-xs"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Ver
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
