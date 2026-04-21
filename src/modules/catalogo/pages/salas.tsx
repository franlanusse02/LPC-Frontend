import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { DataTable } from "@/components/data-table";
import { useApi } from "@/hooks/useApi";

export default function SalasPage() {
  const navigate = useNavigate();
  const { get, post, patch } = useApi();

  const [salas, setSalas] = useState<any[]>([]);
  const [edificios, setEdificios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const [nombre, setNombre] = useState("");
  const [edificioId, setEdificioId] = useState("");

  useEffect(() => {
    Promise.all([
      get("/eventos/salas").then((r) => r.json()),
      get("/eventos/edificios").then((r) => r.json()),
    ]).then(([salasData, edificiosData]) => {
      setSalas(salasData);
      setEdificios(edificiosData);
      setLoading(false);
    });
  }, [get]);

  const openCreate = () => {
    setEditing(null);
    setNombre("");
    setEdificioId("");
    setModalOpen(true);
  };
  const openEdit = (s: any) => {
    setEditing(s);
    setNombre(s.nombre);
    setEdificioId(String(s.edificioId));
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!nombre.trim() || !edificioId) {
      toast.error("Completá todos los campos");
      return;
    }
    setSaving(true);
    try {
      const body = { nombre: nombre.trim(), edificioId: Number(edificioId) };
      const res = editing
        ? await patch(`/eventos/salas/${editing.id}`, body)
        : await post("/eventos/salas", body);
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setSalas((prev) =>
        editing
          ? prev.map((s) => (s.id === saved.id ? saved : s))
          : [...prev, saved],
      );
      toast.success(editing ? "Sala actualizada" : "Sala creada");
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

  const edificioMap = new Map(edificios.map((e) => [e.id, e.nombre]));

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
                Salas
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Gestioná las salas del sistema
              </p>
            </CardTitle>
            <Button size="sm" onClick={openCreate} className="gap-2 font-bold">
              <Plus className="h-4 w-4" /> NUEVO
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            displayedCount={salas.length}
            columns={
              <>
                <th className="px-6 py-3">Sala</th>
                <th className="px-6 py-3">Edificio</th>
                <th className="px-4 py-3 w-12" />
              </>
            }
            rows={salas.map((s) => (
              <tr key={s.id} className="border-b hover:bg-gray-50/60">
                <td className="px-6 py-4 font-medium">{s.nombre}</td>
                <td className="px-6 py-4 text-gray-600">
                  {edificioMap.get(s.edificioId) ?? `ID ${s.edificioId}`}
                </td>
                <td className="px-6 py-4 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(s)}
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
              {editing ? "Editar" : "Nueva"} Sala
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Nombre</label>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre de la sala"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Edificio
                </label>
                <select
                  className="w-full h-10 px-3 border rounded-md text-sm bg-gray-50 border-gray-200"
                  value={edificioId}
                  onChange={(e) => setEdificioId(e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {edificios.map((e) => (
                    <option key={e.id} value={String(e.id)}>
                      {e.nombre}
                    </option>
                  ))}
                </select>
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
