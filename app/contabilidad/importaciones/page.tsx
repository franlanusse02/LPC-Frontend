"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadImportDialog } from "@/components/upload-import-dialog";
import { ImportJobsTable } from "@/components/import-jobs-table";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/models/dto/ApiError";
import { FacturaImportJobResponse } from "@/models/dto/imports/facturas/ImportJobResponse";
import { ProveedorImportJobResponse } from "@/models/dto/imports/proveedores/ImportJobResponse";
import { EstadoJob } from "@/models/enums/EstadoJob";
import { ArrowLeft, Search, Upload } from "lucide-react";

type ImportTab = "facturas" | "proveedores";

export default function ImportacionesHubPage() {
  const router = useRouter();
  const { session, token, isLoading } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<ImportTab>("facturas");
  const [facturaJobs, setFacturaJobs] = useState<FacturaImportJobResponse[]>([]);
  const [proveedorJobs, setProveedorJobs] = useState<ProveedorImportJobResponse[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EstadoJob | "all">("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.replace("/login");
      else if (session.rol === "ENCARGADO") router.replace("/");
    }
  }, [session, isLoading, router]);

  useEffect(() => {
    if (!session || session.rol === "ENCARGADO") return;
    void fetchJobs();
  }, [session]);

  const handleError = (error: unknown) => {
    if (ApiError.isUnauthorized(error)) return; // handled centrally by AuthProvider
    toast({
      variant: "destructive",
      title: "Error",
      description: error instanceof ApiError ? error.message : "No se pudo completar la operación.",
    });
  };

  const fetchJobs = async () => {
    try {
      const [facturasData, proveedoresData] = await Promise.all([
        apiFetch<FacturaImportJobResponse[]>("/api/import/facturas/jobs", {}, token || ""),
        apiFetch<ProveedorImportJobResponse[]>("/api/import/proveedores/jobs", {}, token || ""),
      ]);
      setFacturaJobs(facturasData);
      setProveedorJobs(proveedoresData);
    } catch (error) {
      handleError(error);
    } finally {
      setLoadingJobs(false);
    }
  };

  const filteredFacturaJobs = useMemo(
    () =>
      facturaJobs.filter((job) => {
        const matchesSearch =
          !search.trim() ||
          (job.nombreArchivo ?? "").toLowerCase().includes(search.trim().toLowerCase());
        const matchesStatus = statusFilter === "all" || job.estado === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [facturaJobs, search, statusFilter]
  );

  const filteredProveedorJobs = useMemo(
    () =>
      proveedorJobs.filter((job) => {
        const matchesSearch =
          !search.trim() ||
          (job.nombreArchivo ?? "").toLowerCase().includes(search.trim().toLowerCase());
        const matchesStatus = statusFilter === "all" || job.estado === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [proveedorJobs, search, statusFilter]
  );

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      if (activeTab === "facturas") {
        const job = await apiFetch<FacturaImportJobResponse>(
          "/api/import/facturas",
          { method: "POST", body: formData },
          token || ""
        );
        setUploadOpen(false);
        toast({ title: "Import creado", description: "El archivo se procesó correctamente." });
        router.push(`/contabilidad/importaciones/facturas?jobId=${job.id}`);
        return;
      }

      const job = await apiFetch<ProveedorImportJobResponse>(
        "/api/import/proveedores",
        { method: "POST", body: formData },
        token || ""
      );
      setUploadOpen(false);
      toast({ title: "Import creado", description: "El archivo se procesó correctamente." });
      router.push(`/contabilidad/importaciones/proveedores?jobId=${job.id}`);
    } catch (error) {
      handleError(error);
    } finally {
      setUploading(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="w-full px-4 py-10 sm:px-6 xl:px-8 2xl:px-10">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="gap-2 text-gray-500 hover:text-gray-800">
            <Link href="/contabilidad">
              <ArrowLeft className="h-4 w-4" />
              Volver a Contabilidad
            </Link>
          </Button>
        </div>

        <Card className="overflow-hidden rounded-xl border-0 shadow-md">
          <CardHeader className="border-b px-6 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-gray-800">Importaciones</CardTitle>
                <p className="mt-1 text-sm text-gray-500">
                  Gestioná jobs de import de facturas y proveedores.
                </p>
              </div>
              <Button onClick={() => setUploadOpen(true)} className="gap-2 self-start">
                <Upload className="h-4 w-4" />
                Subir Excel
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 p-6">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ImportTab)} className="gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <TabsList>
                  <TabsTrigger value="facturas">Facturas</TabsTrigger>
                  <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
                </TabsList>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Buscar por archivo..."
                      className="w-64 pl-9"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as EstadoJob | "all")}
                    className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="PROCESANDO">Procesando</option>
                    <option value="COMPLETADO">Completado</option>
                  </select>
                </div>
              </div>

              <TabsContent value="facturas">
                <ImportJobsTable
                  jobs={filteredFacturaJobs}
                  loading={loadingJobs}
                  emptyLabel="No hay imports de facturas registrados."
                  onOpenJob={(jobId) => router.push(`/contabilidad/importaciones/facturas?jobId=${jobId}`)}
                />
              </TabsContent>

              <TabsContent value="proveedores">
                <ImportJobsTable
                  jobs={filteredProveedorJobs}
                  loading={loadingJobs}
                  emptyLabel="No hay imports de proveedores registrados."
                  onOpenJob={(jobId) => router.push(`/contabilidad/importaciones/proveedores?jobId=${jobId}`)}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      <UploadImportDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        tipo={activeTab}
        submitting={uploading}
        onSubmit={handleUpload}
      />
    </div>
  );
}
