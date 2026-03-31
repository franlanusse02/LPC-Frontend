"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/models/dto/ApiError";
import { EdificioResponse } from "@/models/dto/edificio/EdificioResponse";
import { ArrowLeft, Building, Pencil, Plus } from "lucide-react";

export default function EdificiosPage() {
  const router = useRouter();
  const { session, token, isLoading, logout } = useAuth();
  const { toast } = useToast();

  const [edificios, setEdificios] = useState<EdificioResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nombre, setNombre] = useState("");

  const [editarEdificio, setEditarEdificio] = useState<EdificioResponse | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.replace("/login");
      else if (session.rol !== "ADMIN") router.replace("/");
    }
  }, [session, isLoading, router]);

  useEffect(() => {
    if (!session || session.rol !== "ADMIN") return;
    apiFetch<EdificioResponse[]>("/api/edificios", {}, token || "")
      .then((data) => setEdificios(data.sort((a, b) => a.nombre.localeCompare(b.nombre))))
      .catch(handleError)
      .finally(() => setLoading(false));
  }, [session]);

  const handleError = (error: unknown) => {
    if (ApiError.isUnauthorized(error)) { logout(); router.replace("/login"); return; }
    toast({
      variant: "destructive",
      title: "Error",
      description: error instanceof ApiError ? error.message : "No se pudo completar la operación.",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setSubmitting(true);
    try {
      const created = await apiFetch<EdificioResponse>(
        "/api/edificios",
        { method: "POST", body: JSON.stringify({ nombre: nombre.trim() }) },
        token || "",
      );
      setEdificios((prev) => [...prev, created].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setModalOpen(false);
      setNombre("");
      toast({ title: "Edificio creado", description: `${created.nombre} agregado correctamente.` });
    } catch (error) {
      handleError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (edificio: EdificioResponse) => {
    setEditarEdificio(edificio);
    setEditNombre(edificio.nombre);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editarEdificio || !editNombre.trim()) return;
    setEditSubmitting(true);
    try {
      const updated = await apiFetch<EdificioResponse>(
        `/api/edificios/${editarEdificio.id}`,
        { method: "PATCH", body: JSON.stringify({ nombre: editNombre.trim() }) },
        token || "",
      );
      setEdificios((prev) => prev.map((e) => e.id === updated.id ? updated : e).sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setEditarEdificio(null);
      toast({ title: "Edificio actualizado", description: `${updated.nombre} actualizado correctamente.` });
    } catch (error) {
      handleError(error);
    } finally {
      setEditSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session || session.rol !== "ADMIN") return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="gap-2 text-gray-500 hover:text-gray-800">
            <Link href="/"><ArrowLeft className="h-4 w-4" />Volver a Menu Administrador</Link>
          </Button>
        </div>

        <Card className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center border-b px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Edificios</h1>
              <p className="mt-1 text-sm text-gray-500">Gestioná el catálogo de edificios para eventos Galicia.</p>
            </div>
            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
              className="ml-auto gap-2 px-4 text-sm font-semibold uppercase tracking-wide transition hover:scale-105"
            >
              <Plus className="h-4 w-4" />
              Nuevo Edificio
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : edificios.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
                <Building className="h-8 w-8 opacity-50" />
                <p className="text-sm">No hay edificios registrados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100/80 text-left text-xs uppercase tracking-wider text-gray-500">
                      <th className="px-4 py-3">Nombre</th>
                      <th className="px-4 py-3 w-12" />
                    </tr>
                  </thead>
                  <tbody>
                    {edificios.map((edificio) => (
                      <tr key={edificio.id} className="border-b transition-colors hover:bg-gray-50/80">
                        <td className="px-4 py-4 font-medium text-gray-800">{edificio.nombre}</td>
                        <td className="px-4 py-4 text-right">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(edificio)} className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700">
                            <Pencil className="h-3.5 w-3.5" />
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

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuevo Edificio</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={submitting || !nombre.trim()}>
                {submitting ? "Creando..." : "Crear Edificio"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editarEdificio} onOpenChange={(v) => !v && setEditarEdificio(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Edificio</DialogTitle></DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label htmlFor="edit-nombre">Nombre</Label>
                <Input id="edit-nombre" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={editSubmitting || !editNombre.trim()}>
                {editSubmitting ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
