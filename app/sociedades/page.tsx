"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Building2, Pencil } from "lucide-react";
import { SociedadResponse } from "@/models/dto/sociedad/SociedadResponse";
import { CreateSociedadRequest } from "@/models/dto/sociedad/CreateSociedadRequest";
import { ApiError } from "@/models/dto/ApiError";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { BackButton } from "@/components/back-button";

export default function SociedadesPage() {
  const [sociedades, setSociedades] = useState<SociedadResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateSociedadRequest>({
    nombre: "",
    direccion: "",
    cuit: "",
  });
  const [editarSociedad, setEditarSociedad] = useState<SociedadResponse | null>(null);
  const [editForm, setEditForm] = useState({ nombre: "", direccion: "", cuit: "" });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const { session, token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.replace("/login");
      else if (session?.rol !== "ADMIN") router.replace("/");
      else fetchAll();
    }
  }, [session, isLoading, router]);

  const fetchAll = async () => {
    try {
      const data = await apiFetch<SociedadResponse[]>("/api/sociedad", {}, token || "");
      setSociedades(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (s: SociedadResponse) => {
    setEditarSociedad(s);
    setEditForm({ nombre: s.nombre, direccion: s.direccion, cuit: s.cuit });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editarSociedad) return;
    setEditSubmitting(true);
    try {
      const updated = await apiFetch<SociedadResponse>(
        `/api/sociedad/${editarSociedad.id}`,
        { method: "PATCH", body: JSON.stringify(editForm) },
        token || "",
      );
      setSociedades((prev) => prev.map((s) => s.id === updated.id ? updated : s));
      setEditarSociedad(null);
      toast.success("Sociedad actualizada correctamente.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Error al actualizar sociedad.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await apiFetch<SociedadResponse>("/api/sociedad", {
        method: "POST",
        body: JSON.stringify(form),
      }, token || "");
      setSociedades((prev) => [...prev, created]);
      setModalOpen(false);
      setForm({ nombre: "", direccion: "", cuit: "" });
      toast.success("Sociedad creada exitosamente.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Error al crear sociedad.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-6">
          <BackButton fallbackHref="/" />
        </div>
        <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
          <CardContent>
            <CardHeader className="px-6 py-4 flex flex-row items-center">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Sociedades</h1>
                <p className="text-sm text-gray-500 mt-1">Gestioná las sociedades del sistema</p>
              </div>
              <Button
                size="sm"
                onClick={() => setModalOpen(true)}
                className="ml-auto gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-wide transition hover:scale-105"
              >
                <Plus className="h-4 w-4" />
                Nueva Sociedad
              </Button>
            </CardHeader>

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : sociedades.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                <Building2 className="h-8 w-8" />
                <p className="text-sm">No hay sociedades registradas</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {sociedades.map((s) => (
                  <div key={s.id} className="px-6 py-4 flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-gray-800">{s.nombre}</span>
                      <span className="text-sm text-gray-500">{s.direccion}</span>
                      <span className="text-xs text-gray-400">CUIT: {s.cuit}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(s)} className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700 shrink-0 mt-1">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Sociedad</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cuit">CUIT</Label>
                <Input
                  id="cuit"
                  value={form.cuit}
                  onChange={(e) => setForm({ ...form, cuit: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Creando..." : "Crear Sociedad"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editarSociedad} onOpenChange={(v) => !v && setEditarSociedad(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Sociedad</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label htmlFor="edit-nombre">Nombre</Label>
                <Input id="edit-nombre" value={editForm.nombre} onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-direccion">Dirección</Label>
                <Input id="edit-direccion" value={editForm.direccion} onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-cuit">CUIT</Label>
                <Input id="edit-cuit" value={editForm.cuit} onChange={(e) => setEditForm({ ...editForm, cuit: e.target.value })} required />
              </div>
              <Button type="submit" className="w-full" disabled={editSubmitting}>
                {editSubmitting ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
