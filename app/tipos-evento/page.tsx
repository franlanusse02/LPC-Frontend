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
import { TipoEventoResponse } from "@/models/dto/tipo-evento/TipoEventoResponse";
import { ComedorResponse } from "@/models/dto/comedor/ComedorResponse";
import { ArrowLeft, Tag, Pencil, Plus } from "lucide-react";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(n);

type FormState = { nombre: string; precioUnitario: string; comedorId: string };
const emptyForm: FormState = { nombre: "", precioUnitario: "", comedorId: "" };

type FormFieldsProps = {
  f: FormState;
  setF: React.Dispatch<React.SetStateAction<FormState>>;
  comedorOptions: Array<{ value: string; label: string }>;
};

function FormFields({ f, setF, comedorOptions }: FormFieldsProps) {
  return (
    <>
      <div className="space-y-1">
        <Label>Comedor</Label>
        <Combobox
          options={comedorOptions}
          value={f.comedorId}
          onChange={(v) => setF((p) => ({ ...p, comedorId: v ?? "" }))}
          placeholder="Seleccionar comedor..."
          searchPlaceholder="Buscar comedor..."
          emptyText="No se encontraron comedores."
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="nombre">Nombre</Label>
        <Input
          id="nombre"
          value={f.nombre}
          onChange={(e) => setF((p) => ({ ...p, nombre: e.target.value }))}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="precio">Precio Unitario <span className="text-gray-400 font-normal">(opcional)</span></Label>
        <Input
          id="precio"
          type="number"
          min="0"
          step="0.01"
          value={f.precioUnitario}
          onChange={(e) => setF((p) => ({ ...p, precioUnitario: e.target.value }))}
          placeholder="0.00"
        />
      </div>
    </>
  );
}

export default function TiposEventoPage() {
  const router = useRouter();
  const { session, token, isLoading } = useAuth();
  const { toast } = useToast();

  const [tipos, setTipos] = useState<TipoEventoResponse[]>([]);
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const [editarTipo, setEditarTipo] = useState<TipoEventoResponse | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const comedorOptions = comedores.map((c) => ({ value: String(c.id), label: c.nombre }));
  const comedorNameById = Object.fromEntries(comedores.map((c) => [c.id, c.nombre]));

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.replace("/login");
      else if (session.rol !== "ADMIN") router.replace("/");
    }
  }, [session, isLoading, router]);

  useEffect(() => {
    if (!session || session.rol !== "ADMIN") return;
    Promise.all([
      apiFetch<TipoEventoResponse[]>("/api/tipos-evento", {}, token || ""),
      apiFetch<ComedorResponse[]>("/api/comedor", {}, token || ""),
    ])
      .then(([tiposData, comedoresData]) => {
        setTipos(tiposData.sort((a, b) => a.nombre.localeCompare(b.nombre)));
        setComedores(comedoresData.sort((a, b) => a.nombre.localeCompare(b.nombre)));
      })
      .catch(handleError)
      .finally(() => setLoading(false));
  }, [session]);

  const handleError = (error: unknown) => {
    if (ApiError.isUnauthorized(error)) return; // handled centrally by AuthProvider
    toast({
      variant: "destructive",
      title: "Error",
      description: error instanceof ApiError ? error.message : "No se pudo completar la operación.",
    });
  };

  const buildBody = (f: FormState) => ({
    nombre: f.nombre.trim(),
    precio: f.precioUnitario ? Number(f.precioUnitario) : null,
    comedorId: Number(f.comedorId),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.comedorId) return;
    setSubmitting(true);
    try {
      const created = await apiFetch<TipoEventoResponse>(
        "/api/tipos-evento",
        { method: "POST", body: JSON.stringify(buildBody(form)) },
        token || "",
      );
      setTipos((prev) => [...prev, created].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setModalOpen(false);
      setForm(emptyForm);
      toast({ title: "Tipo de evento creado", description: `${created.nombre} agregado correctamente.` });
    } catch (error) {
      handleError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (tipo: TipoEventoResponse) => {
    setEditarTipo(tipo);
    setEditForm({
      nombre: tipo.nombre,
      precioUnitario: tipo.precio != null ? String(tipo.precio) : "",
      comedorId: String(tipo.comedorId),
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editarTipo || !editForm.nombre.trim() || !editForm.comedorId) return;
    setEditSubmitting(true);
    try {
      const updated = await apiFetch<TipoEventoResponse>(
        `/api/tipos-evento/${editarTipo.id}`,
        { method: "PATCH", body: JSON.stringify(buildBody(editForm)) },
        token || "",
      );
      setTipos((prev) => prev.map((t) => t.id === updated.id ? updated : t).sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setEditarTipo(null);
      toast({ title: "Tipo de evento actualizado", description: `${updated.nombre} actualizado correctamente.` });
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
              <h1 className="text-2xl font-bold text-gray-800">Tipos de Evento</h1>
              <p className="mt-1 text-sm text-gray-500">Gestioná los tipos de evento y sus precios unitarios.</p>
            </div>
            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
              className="ml-auto gap-2 px-4 text-sm font-semibold uppercase tracking-wide transition hover:scale-105"
            >
              <Plus className="h-4 w-4" />
              Nuevo Tipo
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : tipos.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
                <Tag className="h-8 w-8 opacity-50" />
                <p className="text-sm">No hay tipos de evento registrados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100/80 text-left text-xs uppercase tracking-wider text-gray-500">
                      <th className="px-4 py-3">Nombre</th>
                      <th className="px-4 py-3">Comedor</th>
                      <th className="px-4 py-3 text-right">Precio Unitario</th>
                      <th className="px-4 py-3 w-12" />
                    </tr>
                  </thead>
                  <tbody>
                    {tipos.map((tipo) => (
                      <tr key={tipo.id} className="border-b transition-colors hover:bg-gray-50/80">
                        <td className="px-4 py-4 font-medium text-gray-800">{tipo.nombre}</td>
                        <td className="px-4 py-4 text-gray-600">{comedorNameById[tipo.comedorId] ?? `ID ${tipo.comedorId}`}</td>
                        <td className="px-4 py-4 text-right font-mono text-gray-600">
                          {tipo.precio != null ? formatCurrency(tipo.precio) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(tipo)} className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700">
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

        <Dialog open={modalOpen} onOpenChange={(v) => { setModalOpen(v); if (!v) setForm(emptyForm); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuevo Tipo de Evento</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <FormFields f={form} setF={setForm} comedorOptions={comedorOptions} />
              <Button type="submit" className="w-full" disabled={submitting || !form.nombre.trim() || !form.comedorId}>
                {submitting ? "Creando..." : "Crear Tipo de Evento"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editarTipo} onOpenChange={(v) => !v && setEditarTipo(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Tipo de Evento</DialogTitle></DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
              <FormFields f={editForm} setF={setEditForm} comedorOptions={comedorOptions} />
              <Button type="submit" className="w-full" disabled={editSubmitting || !editForm.nombre.trim() || !editForm.comedorId}>
                {editSubmitting ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
