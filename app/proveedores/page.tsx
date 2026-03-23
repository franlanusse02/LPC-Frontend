
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/models/dto/ApiError";
import { ProveedorResponse } from "@/models/dto/proveedor/ProveedorResponse";
import { CreateProveedorRequest } from "@/models/dto/proveedor/CreateProveedorRequest";
import { AgregarPuntoDeVentaRequest } from "@/models/dto/proveedor/AgregarPuntoDeVentaRequest";
import { NuevoProveedorModal } from "@/components/nuevo-proveedor-modal";
import { AgregarPuntoDeVentaModal } from "@/components/agregar-punto-de-venta-modal";
import { Plus } from "lucide-react";

export default function ProveedoresPage() {
  const router = useRouter();
  const { session, isLoading, logout } = useAuth();
  const { toast } = useToast();

  const [proveedores, setProveedores] = useState<ProveedorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [agregarModal, setAgregarModal] = useState<ProveedorResponse | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.replace("/login");
      else if (session.rol !== "ADMIN" && session.rol !== "CONTABILIDAD") router.replace("/");
    }
  }, [session, isLoading, router]);

  useEffect(() => {
    if (!session) return;
    apiFetch<ProveedorResponse[]>("/api/proveedores", {}, session.token)
      .then(setProveedores)
      .finally(() => setLoading(false));
  }, [session]);

  const handleError = (err: unknown) => {
    if (ApiError.isUnauthorized(err)) { logout(); router.replace("/login"); return; }
    toast({
      variant: "destructive",
      title: "Error",
      description: err instanceof ApiError ? err.message : "No se pudo completar la operación.",
    });
  };

  const handleNuevoProveedor = async (req: CreateProveedorRequest) => {
    if (!session) return;
    try {
      const nuevo = await apiFetch<ProveedorResponse>("/api/proveedores",
        { method: "POST", body: JSON.stringify(req) }, session.token);
      setProveedores((prev) => [...prev, nuevo]);
      toast({ title: "Proveedor creado", description: `${nuevo.nombre} agregado correctamente.` });
    } catch (err) { handleError(err); throw err; }
  };

  const handleAgregarPuntoVenta = async (proveedorId: number, req: AgregarPuntoDeVentaRequest) => {
    if (!session) return;
    try {
      const updated = await apiFetch<ProveedorResponse>(
        `/api/proveedores/${proveedorId}/agregar-punto-venta`,
        { method: "PATCH", body: JSON.stringify(req) }, session.token);
      setProveedores((prev) => prev.map((p) => p.id === proveedorId ? updated : p));
      toast({ title: "Puntos de venta agregados" });
    } catch (err) { handleError(err); throw err; }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <Card className="border-0 shadow-md rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b px-6 py-4">
            <CardTitle className="text-xl font-bold text-gray-800">Proveedores</CardTitle>
            <Button onClick={() => setNuevoOpen(true)} size="sm"
              className="gap-2 px-4 text-sm font-semibold uppercase tracking-wide transition hover:scale-105">
              <Plus className="h-4 w-4" />
              Nuevo Proveedor
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : proveedores.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
                <p className="text-sm">No hay proveedores registrados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100/80 text-left text-xs uppercase text-gray-500 tracking-wider">
                      <th className="px-4 py-3">Nombre</th>
                      <th className="px-4 py-3">Tax ID</th>
                      <th className="px-4 py-3">Puntos de Venta</th>
                      <th className="px-4 py-3 w-12" />
                    </tr>
                  </thead>
                  <tbody>
                    {proveedores.map((p) => (
                      <tr key={p.id} className="border-b hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-4 font-medium text-gray-800">{p.nombre}</td>
                        <td className="px-4 py-4 font-mono text-xs text-gray-600">{p.taxId}</td>
                        <td className="px-4 py-4">
                          {p.puntosDeVenta.length === 0 ? (
                            <span className="text-gray-300">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {p.puntosDeVenta.map((pv) => (
                                <span key={pv}
                                  className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                                  {pv}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <Button variant="outline" size="sm" onClick={() => setAgregarModal(p)}
                            className="text-xs border-gray-200 text-gray-600 hover:bg-gray-50">
                            + Punto de venta
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <NuevoProveedorModal open={nuevoOpen} onClose={() => setNuevoOpen(false)}
        onConfirm={handleNuevoProveedor} />

      {agregarModal && (
        <AgregarPuntoDeVentaModal
          open={!!agregarModal}
          onClose={() => setAgregarModal(null)}
          proveedorId={agregarModal.id}
          proveedorNombre={agregarModal.nombre}
          onConfirm={handleAgregarPuntoVenta}
        />
      )}
    </div>
  );
}
