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
import { Combobox } from "@/components/ui/combobox";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/models/dto/ApiError";
import { SalaResponse } from "@/models/dto/sala/SalaResponse";
import { EdificioResponse } from "@/models/dto/edificio/EdificioResponse";
import { ArrowLeft, DoorOpen, Pencil, Plus } from "lucide-react";

export default function SalasPage() {
  const router = useRouter();
  const { session, token, isLoading, logout } = useAuth();
  const { toast } = useToast();

  const [salas, setSalas] = useState<SalaResponse[]>([]);
  const [edificios, setEdificios] = useState<EdificioResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<{ nombre: string; edificioId: string }>({ nombre: "", edificioId: "" });

  const [editarSala, setEditarSala] = useState<SalaResponse | null>(null);
  const [editForm, setEditForm] = useState<{ nombre: string; edificioId: string }>({ nombre: "", edificioId: "" });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const edificioOptions = edificios.map((e) => ({ value: String(e.id), label: e.nombre }));

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.replace("/login");
      else if (session.rol !== "ADMIN") router.replace("/");
    }
  }, [session, isLoading, router]);

  useEffect(() => {
    if (!session || session.rol !== "ADMIN") return;
    Promise.all([
      apiFetch<SalaResponse[]>("/api/salas-evento", {}, token || ""),
      apiFetch<EdificioResponse[]>("/api/edificios-evento", {}, token || ""),
    ])
      .then(([salasData, edificiosData]) => {
        setSalas(salasData.sort((a, b) => `${a.edificioNombre}-${a.nombre}`.localeCompare(`${b.edificioNombre}-${b.nombre}`)));
        setEdificios(edificiosData.sort((a, b) => a.nombre.localeCompare(b.nombre)));
      })
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
    if (!form.nombre.trim() || !form.edificioId) return;
    setSubmitting(true);
    try {
      const created = await apiFetch<SalaResponse>(
        "/api/salas-evento",
        { method: "POST", body: JSON.stringify({ nombre: form.nombre.trim(), edificioId: Number(form.edificioId) }) },
        token || "",
      );
      setSalas((prev) => [...prev, created].sort((a, b) => `${a.edificioNombre}-${a.nombre}`.localeCompare(`${b.edificioNombre}-${b.nombre}`)));
      setModalOpen(false);
      setForm({ nombre: "", edificioId: "" });
      toast({ title: "Sala creada", description: `${created.nombre} agregada correctamente.` });
    } catch (error) {
      handleError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (sala: SalaResponse) => {
    setEditarSala(sala);
    setEditForm({ nombre: sala.nombre, edificioId: String(sala.edificioId) });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editarSala || !editForm.nombre.trim() || !editForm.edificioId) return;
    setEditSubmitting(true);
    try {
      const updated = await apiFetch<SalaResponse>(
        `/api/salas-evento/${editarSala.id}`,
        { method: "PATCH", body: JSON.stringify({ nombre: editForm.nombre.trim(), edificioId: Number(editForm.edificioId) }) },
        token || "",
      );
      setSalas((prev) => prev.map((s) => s.id === updated.id ? updated : s).sort((a, b) => `${a.edificioNombre}-${a.nombre}`.localeCompare(`${b.edificioNombre}-${b.nombre}`)));
      setEditarSala(null);
      toast({ title: "Sala actualizada", description: `${updated.nombre} actualizada correctamente.` });
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
              <h1 className="text-2xl font-bold text-gray-800">Salas</h1>
              <p className="mt-1 text-sm text-gray-500">Gestioná el catálogo de salas por edificio para eventos Galicia.</p>
            </div>
            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
              className="ml-auto gap-2 px-4 text-sm font-semibold uppercase tracking-wide transition hover:scale-105"
            >
              <Plus className="h-4 w-4" />
              Nueva Sala
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : salas.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
                <DoorOpen className="h-8 w-8 opacity-50" />
                <p className="text-sm">No hay salas registradas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100/80 text-left text-xs uppercase tracking-wider text-gray-500">
                      <th className="px-4 py-3">Sala</th>
                      <th className="px-4 py-3">Edificio</th>
                      <th className="px-4 py-3 w-12" />
                    </tr>
                  </thead>
                  <tbody>
                    {salas.map((sala) => (
                      <tr key={sala.id} className="border-b transition-colors hover:bg-gray-50/80">
                        <td className="px-4 py-4 font-medium text-gray-800">{sala.nombre}</td>
                        <td className="px-4 py-4 text-gray-600">{sala.edificioNombre}</td>
                        <td className="px-4 py-4 text-right">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(sala)} className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700">
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
            <DialogHeader><DialogTitle>Nueva Sala</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" value={form.nombre} onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label>Edificio</Label>
                <Combobox
                  options={edificioOptions}
                  value={form.edificioId}
                  onChange={(v) => setForm((prev) => ({ ...prev, edificioId: v ?? "" }))}
                  placeholder="Seleccionar edificio..."
                  searchPlaceholder="Buscar edificio..."
                  emptyText="No se encontraron edificios."
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting || !form.nombre.trim() || !form.edificioId}>
                {submitting ? "Creando..." : "Crear Sala"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editarSala} onOpenChange={(v) => !v && setEditarSala(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Sala</DialogTitle></DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label htmlFor="edit-nombre">Nombre</Label>
                <Input id="edit-nombre" value={editForm.nombre} onChange={(e) => setEditForm((prev) => ({ ...prev, nombre: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label>Edificio</Label>
                <Combobox
                  options={edificioOptions}
                  value={editForm.edificioId}
                  onChange={(v) => setEditForm((prev) => ({ ...prev, edificioId: v ?? "" }))}
                  placeholder="Seleccionar edificio..."
                  searchPlaceholder="Buscar edificio..."
                  emptyText="No se encontraron edificios."
                />
              </div>
              <Button type="submit" className="w-full" disabled={editSubmitting || !editForm.nombre.trim() || !editForm.edificioId}>
                {editSubmitting ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
