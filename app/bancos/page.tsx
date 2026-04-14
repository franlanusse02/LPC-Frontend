"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/models/dto/ApiError";
import { BancoResponse } from "@/models/dto/banco/BancoResponse";
import { CreateBancoRequest } from "@/models/dto/banco/CreateBancoRequest";
import { SociedadResponse } from "@/models/dto/sociedad/SociedadResponse";
import { Landmark, Pencil, Plus } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { BackButton } from "@/components/back-button";

export default function BancosPage() {
  const router = useRouter();
  const { session, token, isLoading } = useAuth();
  const { toast } = useToast();

  const [bancos, setBancos] = useState<BancoResponse[]>([]);
  const [sociedades, setSociedades] = useState<SociedadResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateBancoRequest>({
    nombre: "",
    sociedadId: 0,
  });
  const [editarBanco, setEditarBanco] = useState<BancoResponse | null>(null);
  const [editForm, setEditForm] = useState<{ nombre: string; sociedadId: number }>({ nombre: "", sociedadId: 0 });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const sociedadOptions = sociedades.map((sociedad) => ({
    value: String(sociedad.id),
    label: sociedad.nombre,
  }));

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.replace("/login");
      else if (session.rol !== "ADMIN" && session.rol !== "CONTABILIDAD")
        router.replace("/");
    }
  }, [session, isLoading, router]);

  useEffect(() => {
    if (!session || (session.rol !== "ADMIN" && session.rol !== "CONTABILIDAD"))
      return;
    void fetchAll();
  }, [session]);

  const handleError = (error: unknown) => {
    if (ApiError.isUnauthorized(error)) return; // handled centrally by AuthProvider
    toast({
      variant: "destructive",
      title: "Error",
      description: error instanceof ApiError ? error.message : "No se pudo completar la operación.",
    });
  };

  const fetchAll = async () => {
    try {
      const [bancosData, sociedadesData] = await Promise.all([
        apiFetch<BancoResponse[]>("/api/bancos", {}, token || ""),
        apiFetch<SociedadResponse[]>("/api/sociedad", {}, token || ""),
      ]);
      setBancos(bancosData);
      setSociedades(sociedadesData);
      if (sociedadesData.length > 0) {
        setForm((prev) => ({
          ...prev,
          sociedadId: prev.sociedadId || sociedadesData[0].id,
        }));
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (banco: BancoResponse) => {
    setEditarBanco(banco);
    setEditForm({ nombre: banco.nombre, sociedadId: banco.sociedadId });
  };

  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editarBanco || !editForm.nombre.trim() || !editForm.sociedadId) return;
    setEditSubmitting(true);
    try {
      const updated = await apiFetch<BancoResponse>(
        `/api/bancos/${editarBanco.id}`,
        { method: "PATCH", body: JSON.stringify({ nombre: editForm.nombre.trim(), sociedadId: editForm.sociedadId }) },
        token || "",
      );
      setBancos((prev) =>
        prev.map((b) => b.id === updated.id ? updated : b)
          .sort((l, r) => `${l.sociedadNombre}-${l.nombre}`.localeCompare(`${r.sociedadNombre}-${r.nombre}`))
      );
      setEditarBanco(null);
      toast({ title: "Banco actualizado", description: `${updated.nombre} actualizado correctamente.` });
    } catch (error) {
      handleError(error);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.nombre.trim() || !form.sociedadId) return;

    setSubmitting(true);
    try {
      const created = await apiFetch<BancoResponse>(
        "/api/bancos",
        {
          method: "POST",
          body: JSON.stringify({
            nombre: form.nombre.trim(),
            sociedadId: form.sociedadId,
          }),
        },
        token || ""
      );
      setBancos((prev) =>
        [...prev, created].sort((left, right) =>
          `${left.sociedadNombre}-${left.nombre}`.localeCompare(`${right.sociedadNombre}-${right.nombre}`)
        )
      );
      setModalOpen(false);
      setForm((prev) => ({ ...prev, nombre: "" }));
      toast({ title: "Banco creado", description: `${created.nombre} agregado correctamente.` });
    } catch (error) {
      handleError(error);
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

  if (!session || (session.rol !== "ADMIN" && session.rol !== "CONTABILIDAD"))
    return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6">
          <BackButton
            fallbackHref={session?.rol === "ADMIN" ? "/" : "/contabilidad/catalogo"}
          />
        </div>

        <Card className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center border-b px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Bancos</h1>
              <p className="mt-1 text-sm text-gray-500">Gestioná el catálogo de bancos por sociedad.</p>
            </div>
            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
              className="ml-auto gap-2 px-4 text-sm font-semibold uppercase tracking-wide transition hover:scale-105"
            >
              <Plus className="h-4 w-4" />
              Nuevo Banco
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : bancos.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
                <Landmark className="h-8 w-8 opacity-50" />
                <p className="text-sm">No hay bancos registrados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100/80 text-left text-xs uppercase tracking-wider text-gray-500">
                      <th className="px-4 py-3">Banco</th>
                      <th className="px-4 py-3">Sociedad</th>
                      <th className="px-4 py-3 w-12" />
                    </tr>
                  </thead>
                  <tbody>
                    {bancos.map((banco) => (
                      <tr key={banco.id} className="border-b transition-colors hover:bg-gray-50/80">
                        <td className="px-4 py-4 font-medium text-gray-800">{banco.nombre}</td>
                        <td className="px-4 py-4 text-gray-600">{banco.sociedadNombre}</td>
                        <td className="px-4 py-4 text-right">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(banco)} className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700">
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
            <DialogHeader>
              <DialogTitle>Nuevo Banco</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={form.nombre}
                  onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="sociedad">Sociedad</Label>
                <Combobox
                  options={sociedadOptions}
                  value={form.sociedadId ? String(form.sociedadId) : ""}
                  onChange={(value) => {
                    if (!value) return;
                    setForm((prev) => ({ ...prev, sociedadId: Number(value) }));
                  }}
                  placeholder="Seleccionar sociedad..."
                  searchPlaceholder="Buscar sociedad..."
                  emptyText="No se encontraron sociedades."
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Creando..." : "Crear Banco"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editarBanco} onOpenChange={(v) => !v && setEditarBanco(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Banco</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label htmlFor="edit-nombre">Nombre</Label>
                <Input
                  id="edit-nombre"
                  value={editForm.nombre}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, nombre: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-sociedad">Sociedad</Label>
                <Combobox
                  options={sociedadOptions}
                  value={editForm.sociedadId ? String(editForm.sociedadId) : ""}
                  onChange={(value) => {
                    if (!value) return;
                    setEditForm((prev) => ({ ...prev, sociedadId: Number(value) }));
                  }}
                  placeholder="Seleccionar sociedad..."
                  searchPlaceholder="Buscar sociedad..."
                  emptyText="No se encontraron sociedades."
                />
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
