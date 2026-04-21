import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { DataTable, SortableTh } from "@/components/data-table";
import { useApi } from "@/hooks/useApi";
import type { ComedorResponse } from "../types/ComedorResponse";
import type { SociedadResponse } from "../types/SociedadResponse";

type SortKey = "nombre" | "sociedad";

export default function ComedoresPage() {
  const navigate = useNavigate();
  const { get, post, patch } = useApi();

  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [sociedades, setSociedades] = useState<SociedadResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ComedorResponse | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("nombre");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [nombre, setNombre] = useState("");
  const [sociedadId, setSociedadId] = useState("");

  useEffect(() => {
    Promise.all([
      get("/comedores").then((r) => r.json()),
      get("/sociedades").then((r) => r.json()),
    ]).then(([comedoresData, sociedadesData]) => {
      setComedores(comedoresData);
      setSociedades(sociedadesData);
      setLoading(false);
    });
  }, [get]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = [...comedores].sort((a, b) => {
    const av =
      sortKey === "sociedad"
        ? (sociedades.find((s) => s.id === a.sociedadId)?.nombre ?? "")
        : a.nombre;
    const bv =
      sortKey === "sociedad"
        ? (sociedades.find((s) => s.id === b.sociedadId)?.nombre ?? "")
        : b.nombre;
    return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const openCreate = () => {
    setEditing(null);
    setNombre("");
    setSociedadId("");
    setModalOpen(true);
  };
  const openEdit = (c: ComedorResponse) => {
    setEditing(c);
    setNombre(c.nombre);
    setSociedadId(String(c.sociedadId));
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!nombre.trim() || !sociedadId) {
      toast.error("Completá todos los campos");
      return;
    }
    setSaving(true);
    try {
      const body = { nombre: nombre.trim(), sociedadId: Number(sociedadId) };
      const res = editing
        ? await patch(`/comedores/${editing.id}`, body)
        : await post("/comedores", body);
      if (!res.ok) throw new Error();
      const saved = (await res.json()) as ComedorResponse;
      setComedores((prev) =>
        editing
          ? prev.map((c) => (c.id === saved.id ? saved : c))
          : [...prev, saved],
      );
      toast.success(editing ? "Comedor actualizado" : "Comedor creado");
      setModalOpen(false);
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );

  return (
    <div className="px-18 py-8">
      <div className="max-w-2/3 mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
      </div>

      <Card className="mx-auto max-w-2/3 border-0 shadow-md mt-4">
        <CardHeader className="border-b px-6 py-4">
          <div className="flex flex-row justify-between w-full">
            <CardTitle className="tracking-wide">
              <h1 className="text-xl font-bold text-gray-800 uppercase">
                Comedores
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Gestioná los comedores del sistema
              </p>
            </CardTitle>
            <Button size="sm" onClick={openCreate} className="gap-2 font-bold">
              <Plus className="h-4 w-4" /> NUEVO
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            displayedCount={sorted.length}
            columns={
              <>
                <SortableTh
                  label="Nombre"
                  col="nombre"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Sociedad"
                  col="sociedad"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <th className="px-4 py-3 w-12" />
              </>
            }
            rows={sorted.map((c) => (
              <tr key={c.id} className="border-b hover:bg-gray-50/60">
                <td className="px-6 py-4 font-medium">{c.nombre}</td>
                <td className="px-6 py-4 text-gray-600">
                  {sociedades.find((s) => s.id === c.sociedadId)?.nombre ?? ""}
                </td>
                <td className="px-6 py-4 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(c)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          ></DataTable>
        </CardContent>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">
              {editing ? "Editar" : "Nuevo"} Comedor
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Nombre</label>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre del comedor"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Sociedad
                </label>
                <Select value={sociedadId} onValueChange={setSociedadId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sociedades.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
