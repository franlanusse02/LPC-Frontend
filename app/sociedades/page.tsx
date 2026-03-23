"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Building2 } from "lucide-react";
import Link from "next/link";
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
          <Button variant="ghost" size="sm" asChild className="gap-2 text-gray-500 hover:text-gray-800">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Volver a Menu Administrador
            </Link>
          </Button>
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
                  <div key={s.id} className="px-6 py-4 flex flex-col gap-1">
                    <span className="font-medium text-gray-800">{s.nombre}</span>
                    <span className="text-sm text-gray-500">{s.direccion}</span>
                    <span className="text-xs text-gray-400">CUIT: {s.cuit}</span>
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
      </main>
    </div>
  );
}

