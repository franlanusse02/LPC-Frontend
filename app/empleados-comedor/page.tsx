"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/header";
import { BackButton } from "@/components/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Combobox } from "@/components/ui/combobox";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/models/dto/ApiError";
import { ComedorResponse } from "@/models/dto/comedor/ComedorResponse";
import { EmpleadoComedorResponse } from "@/models/dto/empleado/EmpleadoComedorResponse";
import { PatchEmpleadoComedorRequest } from "@/models/dto/empleado/PatchEmpleadoComedorRequest";
import { NuevoEmpleadoComedorModal } from "@/components/nuevo-empleado-comedor-modal";
import { CreateEmpleadoComedorRequest } from "@/models/dto/empleado/CreateEmpleadoComedorRequest";
import { Pencil, Plus, UserMinus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EmpleadosComedorPage() {
  const router = useRouter();
  const { session, isLoading } = useAuth();
  const { toast } = useToast();

  const [empleados, setEmpleados] = useState<EmpleadoComedorResponse[]>([]);
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [comedorFilter, setComedorFilter] = useState("");

  const [editarEmpleado, setEditarEmpleado] = useState<EmpleadoComedorResponse | null>(null);
  const [editForm, setEditForm] = useState<{ comedorId: string; nombre: string; email: string; taxId: string }>({
    comedorId: "", nombre: "", email: "", taxId: "",
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const comedorNameById = useMemo(
    () => Object.fromEntries(comedores.map((c) => [c.id, c.nombre])),
    [comedores],
  );

  const comedorOptions = useMemo(
    () => comedores.map((c) => ({ value: String(c.id), label: c.nombre })),
    [comedores],
  );

  const displayedEmpleados = useMemo(() => {
    if (!comedorFilter) return empleados;
    return empleados.filter((e) => String(e.comedorId) === comedorFilter);
  }, [empleados, comedorFilter]);

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.replace("/login");
      else if (session.rol !== "ADMIN" && session.rol !== "CONTABILIDAD") router.replace("/");
    }
  }, [session, isLoading, router]);

  useEffect(() => {
    if (!session) return;
    Promise.all([
      apiFetch<EmpleadoComedorResponse[]>("/api/comedores/empleados", {}, session.token),
      apiFetch<ComedorResponse[]>("/api/comedores", {}, session.token),
    ])
      .then(([emps, coms]) => {
        setEmpleados(emps);
        setComedores(coms);
      })
      .finally(() => setLoading(false));
  }, [session]);

  const handleError = (err: unknown) => {
    if (ApiError.isUnauthorized(err)) return;
    toast({
      variant: "destructive",
      title: "Error",
      description: err instanceof ApiError ? err.message : "No se pudo completar la operación.",
    });
  };

  const handleNuevoEmpleado = async (req: CreateEmpleadoComedorRequest) => {
    if (!session) return;
    try {
      const nuevo = await apiFetch<EmpleadoComedorResponse>(
        "/api/comedores/empleados",
        { method: "POST", body: JSON.stringify(req) },
        session.token,
      );
      setEmpleados((prev) => [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      toast({ title: "Empleado creado", description: `${nuevo.nombre} agregado correctamente.` });
    } catch (err) { handleError(err); throw err; }
  };

  const openEdit = (e: EmpleadoComedorResponse) => {
    setEditarEmpleado(e);
    setEditForm({
      comedorId: String(e.comedorId),
      nombre: e.nombre,
      email: e.email ?? "",
      taxId: e.taxId != null ? String(e.taxId) : "",
    });
  };

  const handleEditarEmpleado = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!editarEmpleado || !editForm.nombre.trim() || !editForm.comedorId) return;
    setEditSubmitting(true);
    try {
      const body: PatchEmpleadoComedorRequest = {
        comedorId: Number(editForm.comedorId),
        nombre: editForm.nombre.trim(),
        email: editForm.email.trim() || null,
        taxId: editForm.taxId.trim() ? Number(editForm.taxId) : null,
      };
      const updated = await apiFetch<EmpleadoComedorResponse>(
        `/api/comedores/empleados/${editarEmpleado.id}`,
        { method: "PATCH", body: JSON.stringify(body) },
        session!.token,
      );
      setEmpleados((prev) =>
        prev.map((e) => e.id === updated.id ? updated : e).sort((a, b) => a.nombre.localeCompare(b.nombre)),
      );
      setEditarEmpleado(null);
      toast({ title: "Empleado actualizado", description: `${updated.nombre} actualizado correctamente.` });
    } catch (err) { handleError(err); }
    finally { setEditSubmitting(false); }
  };

  const handleDesactivar = async (empleado: EmpleadoComedorResponse) => {
    if (!session) return;
    try {
      await apiFetch(`/api/comedores/empleados/${empleado.id}`, { method: "DELETE" }, session.token);
      setEmpleados((prev) => prev.filter((e) => e.id !== empleado.id));
      toast({ title: "Empleado desactivado", description: `${empleado.nombre} fue desactivado.` });
    } catch (err) { handleError(err); }
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
        <div className="mb-6">
          <BackButton fallbackHref={session.rol === "ADMIN" ? "/" : "/contabilidad/catalogo"} />
        </div>

        <Card className="border-0 shadow-md rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b px-6 py-4 gap-4">
            <CardTitle className="text-xl font-bold text-gray-800">Empleados de comedor</CardTitle>
            <div className="flex items-center gap-3">
              <Combobox
                options={[{ value: "", label: "Todos los comedores" }, ...comedorOptions]}
                value={comedorFilter}
                onChange={setComedorFilter}
                placeholder="Filtrar por comedor..."
                searchPlaceholder="Buscar comedor..."
                className="w-52"
              />
              <Button
                onClick={() => setNuevoOpen(true)}
                size="sm"
                className="gap-2 px-4 text-sm font-semibold uppercase tracking-wide transition hover:scale-105 shrink-0"
              >
                <Plus className="h-4 w-4" />
                Nuevo empleado
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : displayedEmpleados.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
                <p className="text-sm">
                  {empleados.length === 0
                    ? "No hay empleados registrados"
                    : "Ningún empleado coincide con el filtro"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100/80 text-left text-xs uppercase text-gray-500 tracking-wider">
                      <th className="px-4 py-3">Nombre</th>
                      <th className="px-4 py-3">Comedor</th>
                      <th className="px-4 py-3">DNI</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3 w-10" />
                      <th className="px-4 py-3 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {displayedEmpleados.map((emp) => (
                      <tr key={emp.id} className="border-b hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-4 font-medium text-gray-800">{emp.nombre}</td>
                        <td className="px-4 py-4 text-gray-600">
                          {comedorNameById[emp.comedorId] ?? <span className="text-gray-300">—</span>}
                        </td>
                        <td className={cn("px-4 py-4 text-sm", emp.taxId != null ? "text-gray-600" : "text-gray-300")}>
                          {emp.taxId ?? "—"}
                        </td>
                        <td className={cn("px-4 py-4 text-sm", emp.email ? "text-gray-600" : "text-gray-300")}>
                          {emp.email ?? "—"}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(emp)}
                            className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700"
                            title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDesactivar(emp)}
                            className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                            title="Desactivar"
                          >
                            <UserMinus className="h-3.5 w-3.5" />
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

      <NuevoEmpleadoComedorModal
        open={nuevoOpen}
        onClose={() => setNuevoOpen(false)}
        comedores={comedores}
        onConfirm={handleNuevoEmpleado}
      />

      <Dialog open={!!editarEmpleado} onOpenChange={(v) => !v && setEditarEmpleado(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar empleado</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditarEmpleado} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>Comedor *</Label>
              <Combobox
                options={comedorOptions}
                value={editForm.comedorId}
                onChange={(v) => setEditForm((p) => ({ ...p, comedorId: v }))}
                placeholder="Seleccionar comedor..."
                searchPlaceholder="Buscar comedor..."
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ee-nombre">Nombre *</Label>
              <Input
                id="ee-nombre"
                value={editForm.nombre}
                onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ee-email">Email (opcional)</Label>
              <Input
                id="ee-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="correo@empresa.com"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ee-taxId">DNI (opcional)</Label>
              <Input
                id="ee-taxId"
                value={editForm.taxId}
                onChange={(e) => setEditForm((p) => ({ ...p, taxId: e.target.value.replace(/\D/g, "") }))}
                placeholder="20123456789"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={editSubmitting || !editForm.nombre.trim() || !editForm.comedorId}
            >
              {editSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
