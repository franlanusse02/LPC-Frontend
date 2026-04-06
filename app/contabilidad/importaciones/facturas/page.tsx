"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, RefreshCw, Search } from "lucide-react";
import { Header } from "@/components/header";
import { FacturaImportRowEditorDrawer } from "@/components/factura-import-row-editor-drawer";
import { FacturaImportRowsTable } from "@/components/factura-import-rows-table";
import { JobStatusBadge } from "@/components/job-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/models/dto/ApiError";
import { BancoResponse } from "@/models/dto/banco/BancoResponse";
import { ComedorResponse } from "@/models/dto/comedor/ComedorResponse";
import { ImportRowVersionRequest } from "@/models/dto/imports/ImportRowVersionRequest";
import { FacturaImportJobResponse } from "@/models/dto/imports/facturas/ImportJobResponse";
import { PatchImportRowFacturaRequest } from "@/models/dto/imports/facturas/PatchImportRowFacturaRequest";
import { ImportRowFacturaResponse } from "@/models/dto/imports/facturas/ImportRowFacturaResponse";
import { ProveedorResponse } from "@/models/dto/proveedor/ProveedorResponse";
import { EstadoFila } from "@/models/enums/EstadoFila";

type AssignmentFilter = "all" | "mine" | "unassigned" | "others";

function FacturaImportJobDetailContent() {
  const searchParams = useSearchParams();
  const jobId = Number(searchParams.get("jobId"));
  const router = useRouter();
  const { session, token, isLoading } = useAuth();
  const { toast } = useToast();

  const [job, setJob] = useState<FacturaImportJobResponse | null>(null);
  const [rows, setRows] = useState<ImportRowFacturaResponse[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorResponse[]>([]);
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [bancos, setBancos] = useState<BancoResponse[]>([]);
  const [loadingJob, setLoadingJob] = useState(true);
  const [loadingRows, setLoadingRows] = useState(true);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<EstadoFila | "all">("all");
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>("all");

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.replace("/login");
      else if (session.rol === "ENCARGADO") router.replace("/");
    }
  }, [session, isLoading, router]);

  useEffect(() => {
    if (!session || session.rol === "ENCARGADO" || !Number.isFinite(jobId) || jobId <= 0) return;
    void fetchCatalogs();
    void fetchJobAndRows();
  }, [session, jobId]);

  const handleError = async (error: unknown, conflictMessage?: string) => {
    if (ApiError.isUnauthorized(error)) return; // handled centrally by AuthProvider

    if (error instanceof ApiError && error.status === 409) {
      toast({
        variant: "destructive",
        title: "Conflicto de concurrencia",
        description: conflictMessage ?? "La fila cambió. Se refrescaron los datos.",
      });
      await fetchJobAndRows();
      return;
    }

    toast({
      variant: "destructive",
      title: "Error",
      description: error instanceof ApiError ? error.message : "No se pudo completar la operación.",
    });
  };

  const fetchCatalogs = async () => {
    try {
      const [proveedoresData, comedoresData, bancosData] = await Promise.all([
        apiFetch<ProveedorResponse[]>("/api/proveedores", {}, token || ""),
        apiFetch<ComedorResponse[]>("/api/comedor", {}, token || ""),
        apiFetch<BancoResponse[]>("/api/bancos", {}, token || ""),
      ]);
      setProveedores(proveedoresData);
      setComedores(comedoresData);
      setBancos(bancosData);
    } catch (error) {
      await handleError(error);
    } finally {
      setLoadingCatalogs(false);
    }
  };

  const fetchJobAndRows = async () => {
    setLoadingJob(true);
    setLoadingRows(true);
    try {
      const [jobData, rowsData] = await Promise.all([
        apiFetch<FacturaImportJobResponse>(`/api/import/facturas/jobs/${jobId}`, {}, token || ""),
        apiFetch<ImportRowFacturaResponse[]>(`/api/import/facturas/jobs/${jobId}/rows`, {}, token || ""),
      ]);
      setJob(jobData);
      setRows(rowsData);
    } catch (error) {
      await handleError(error);
    } finally {
      setLoadingJob(false);
      setLoadingRows(false);
    }
  };

  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedRowId) ?? null,
    [rows, selectedRowId],
  );

  const currentUserId = session?.cuil ?? null;

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesStatus = estadoFilter === "all" || row.estado === estadoFilter;
      const matchesSearch =
        !search.trim() ||
        [row.excelId, row.numeroFactura, row.proveedorNombre, row.comedorNombre, row.errors]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(search.trim().toLowerCase()));

      const mine = row.asignadoAId != null && String(row.asignadoAId) === String(currentUserId);
      const unassigned = row.estadoAsignacion === "SIN_ASIGNAR";
      const matchesAssignment =
        assignmentFilter === "all" ||
        (assignmentFilter === "mine" && mine) ||
        (assignmentFilter === "unassigned" && unassigned) ||
        (assignmentFilter === "others" && !mine && !unassigned);

      return matchesStatus && matchesSearch && matchesAssignment;
    });
  }, [rows, estadoFilter, search, assignmentFilter, currentUserId]);

  const replaceRow = (updatedRow: ImportRowFacturaResponse) => {
    setRows((prev) => prev.map((row) => (row.id === updatedRow.id ? updatedRow : row)));
    setSelectedRowId(updatedRow.id);
  };

  const closeDrawer = (releaseOnClose: boolean) => {
    const rowToRelease = selectedRow;
    const shouldRelease =
      releaseOnClose &&
      rowToRelease != null &&
      rowToRelease.estadoAsignacion === "ASIGNADA" &&
      rowToRelease.asignadoAId != null &&
      String(rowToRelease.asignadoAId) === String(currentUserId) &&
      rowToRelease.estado !== "APPLIED";

    setDrawerOpen(false);
    setSelectedRowId(null);

    if (!shouldRelease) return;

    void (async () => {
      try {
        const updatedRow = await apiFetch<ImportRowFacturaResponse>(
          `/api/import/facturas/jobs/${jobId}/rows/${rowToRelease.id}/desasignar`,
          { method: "POST", body: JSON.stringify(requestVersion(rowToRelease)) },
          token || "",
        );
        setRows((prev) => prev.map((row) => (row.id === updatedRow.id ? updatedRow : row)));
      } catch (error) {
        await handleError(error, "No se pudo liberar la fila al cerrar.");
      }
    })();
  };

  const requestVersion = (row: ImportRowFacturaResponse): ImportRowVersionRequest => ({
    version: row.version,
  });

  const handleTake = async (row: ImportRowFacturaResponse) => {
    setSubmitting(true);
    try {
      const updatedRow = await apiFetch<ImportRowFacturaResponse>(
        `/api/import/facturas/jobs/${jobId}/rows/${row.id}/asignar`,
        { method: "POST", body: JSON.stringify(requestVersion(row)) },
        token || "",
      );
      replaceRow(updatedRow);
      setDrawerOpen(true);
      const updatedJob = await apiFetch<FacturaImportJobResponse>(`/api/import/facturas/jobs/${jobId}`, {}, token || "");
      setJob(updatedJob);
      toast({ title: "Fila asignada", description: `Tomaste la fila ${updatedRow.rowIndex}.` });
    } catch (error) {
      await handleError(error, "Otra persona ya tomó o modificó esta fila.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = async (payload: PatchImportRowFacturaRequest) => {
    if (!selectedRow) return;
    setSubmitting(true);
    try {
      const updatedRow = await apiFetch<ImportRowFacturaResponse>(
        `/api/import/facturas/jobs/${jobId}/rows/${selectedRow.id}`,
        { method: "PATCH", body: JSON.stringify(payload) },
        token || "",
      );
      replaceRow(updatedRow);
      const updatedJob = await apiFetch<FacturaImportJobResponse>(`/api/import/facturas/jobs/${jobId}`, {}, token || "");
      setJob(updatedJob);
      toast({ title: "Fila actualizada" });
    } catch (error) {
      await handleError(error, "La fila cambió mientras la editabas.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRowAction = async (
    action: "revalidar" | "desasignar" | "apply",
    successTitle: string,
    conflictMessage: string,
  ) => {
    if (!selectedRow) return;
    setSubmitting(true);
    try {
      const updatedRow = await apiFetch<ImportRowFacturaResponse>(
        `/api/import/facturas/jobs/${jobId}/rows/${selectedRow.id}/${action}`,
        { method: "POST", body: JSON.stringify(requestVersion(selectedRow)) },
        token || "",
      );
      replaceRow(updatedRow);
      const updatedJob = await apiFetch<FacturaImportJobResponse>(`/api/import/facturas/jobs/${jobId}`, {}, token || "");
      setJob(updatedJob);
      toast({ title: successTitle });
    } catch (error) {
      await handleError(error, conflictMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyReady = async () => {
    setSubmitting(true);
    try {
      const updatedJob = await apiFetch<FacturaImportJobResponse>(
        `/api/import/facturas/jobs/${jobId}/apply`,
        { method: "POST" },
        token || "",
      );
      setJob(updatedJob);
      await fetchJobAndRows();
      toast({ title: "Filas aplicadas", description: "Se aplicaron las filas listas del job." });
    } catch (error) {
      await handleError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRow) return;
    if (!window.confirm(`Eliminar la fila ${selectedRow.rowIndex} del import? Esta acción no se puede deshacer.`)) {
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch<void>(
        `/api/import/facturas/jobs/${jobId}/rows/${selectedRow.id}`,
        { method: "DELETE", body: JSON.stringify(requestVersion(selectedRow)) },
        token || "",
      );
      setRows((prev) => prev.filter((row) => row.id !== selectedRow.id));
      closeDrawer(false);
      const updatedJob = await apiFetch<FacturaImportJobResponse>(`/api/import/facturas/jobs/${jobId}`, {}, token || "");
      setJob(updatedJob);
      toast({ title: "Fila eliminada", description: `Se eliminó la fila ${selectedRow.rowIndex}.` });
    } catch (error) {
      await handleError(error, "La fila cambió antes de eliminarla.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session || session.rol === "ENCARGADO") return null;

  if (!Number.isFinite(jobId) || jobId <= 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="w-full px-4 py-10 sm:px-6 xl:px-8 2xl:px-10">
          <Card className="rounded-xl border-0 shadow-md">
            <CardContent className="space-y-4 p-6">
              <h1 className="text-xl font-bold text-gray-800">Job inválido</h1>
              <p className="text-sm text-gray-500">
                Abrí esta pantalla desde el hub de importaciones para cargar un job válido.
              </p>
              <Button asChild>
                <Link href="/contabilidad/importaciones">Volver a Importaciones</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const summary = job ?? {
    totalFilas: rows.length,
    filasListas: rows.filter((row) => row.estado === "READY").length,
    filasConflicto: rows.filter((row) => row.estado === "CONFLICT").length,
    filasInvalidas: rows.filter((row) => row.estado === "INVALID").length,
    filasAplicadas: rows.filter((row) => row.estado === "APPLIED").length,
  };

  const isMine = selectedRow?.asignadoAId != null && String(selectedRow.asignadoAId) === String(currentUserId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="w-full px-4 py-10 sm:px-6 xl:px-8 2xl:px-10">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="gap-2 text-gray-500 hover:text-gray-800">
            <Link href="/contabilidad/importaciones">
              <ArrowLeft className="h-4 w-4" />
              Volver a Importaciones
            </Link>
          </Button>
        </div>

        <Card className="overflow-hidden rounded-xl border-0 shadow-md">
          <CardHeader className="border-b px-6 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-xl font-bold text-gray-800">
                    Import de Facturas
                  </CardTitle>
                  {job && <JobStatusBadge estado={job.estado} />}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {job?.nombreArchivo ?? "Cargando archivo..."}
                </p>
                {job && (
                  <p className="mt-1 text-xs text-gray-400">
                    Creado {new Date(job.creadoEn).toLocaleString("es-AR")}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => void fetchJobAndRows()}
                  disabled={loadingJob || loadingRows || submitting}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refrescar
                </Button>
                <Button onClick={() => void handleApplyReady()} disabled={submitting || loadingJob || loadingRows}>
                  Aplicar listas
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <Card className="border border-gray-200 shadow-none">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{summary.totalFilas}</p>
                </CardContent>
              </Card>
              <Card className="border border-gray-200 shadow-none">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ready</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-700">{summary.filasListas}</p>
                </CardContent>
              </Card>
              <Card className="border border-gray-200 shadow-none">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Conflict</p>
                  <p className="mt-2 text-2xl font-bold text-rose-700">{summary.filasConflicto}</p>
                </CardContent>
              </Card>
              <Card className="border border-gray-200 shadow-none">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Invalid</p>
                  <p className="mt-2 text-2xl font-bold text-orange-700">{summary.filasInvalidas}</p>
                </CardContent>
              </Card>
              <Card className="border border-gray-200 shadow-none">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Applied</p>
                  <p className="mt-2 text-2xl font-bold text-sky-700">{summary.filasAplicadas}</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por proveedor, número, comedor o error..."
                  className="pl-9"
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value={estadoFilter}
                  onChange={(event) => setEstadoFilter(event.target.value as EstadoFila | "all")}
                  className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm"
                >
                  <option value="all">Todos los estados</option>
                  <option value="READY">Ready</option>
                  <option value="CONFLICT">Conflict</option>
                  <option value="INVALID">Invalid</option>
                  <option value="APPLIED">Applied</option>
                </select>

                <select
                  value={assignmentFilter}
                  onChange={(event) => setAssignmentFilter(event.target.value as AssignmentFilter)}
                  className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm"
                >
                  <option value="all">Todas las asignaciones</option>
                  <option value="mine">Asignadas a mí</option>
                  <option value="unassigned">Sin asignar</option>
                  <option value="others">Asignadas a otro</option>
                </select>
              </div>
            </div>

            <FacturaImportRowsTable
              rows={filteredRows}
              loading={loadingRows || loadingCatalogs}
              currentUserId={currentUserId}
              onTake={(row) => void handleTake(row)}
              onOpen={(row) => {
                setSelectedRowId(row.id);
                setDrawerOpen(true);
              }}
            />
          </CardContent>
        </Card>
      </main>

      <FacturaImportRowEditorDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          if (open) {
            setDrawerOpen(true);
            return;
          }
          closeDrawer(true);
        }}
        row={selectedRow}
        proveedores={proveedores}
        comedores={comedores}
        bancos={bancos}
        isMine={Boolean(isMine)}
        submitting={submitting}
        onSave={handleSave}
        onRevalidate={() =>
          handleRowAction("revalidar", "Fila revalidada", "La fila cambió antes de revalidarla.")
        }
        onApply={() =>
          handleRowAction("apply", "Fila aplicada", "La fila cambió antes de aplicarla.")
        }
        onDelete={handleDelete}
      />
    </div>
  );
}

export default function FacturaImportJobDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <FacturaImportJobDetailContent />
    </Suspense>
  );
}
