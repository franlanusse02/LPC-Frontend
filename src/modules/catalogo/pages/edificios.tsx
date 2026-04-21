import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { DataTable } from "@/components/data-table";
import { useApi } from "@/hooks/useApi";

export default function EdificiosPage() {
  const navigate = useNavigate();
  const { get, post, patch } = useApi();

  const [edificios, setEdificios] = useState<any[]>([]);
  const [comedores, setComedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const [nombre, setNombre] = useState("");
  const [comedorId, setComedorId] = useState("");

  useEffect(() => {
    Promise.all([
      get("/eventos/edificios").then((r) => r.json()),
      get("/comedores").then((r) => r.json()),
    ]).then(([edificiosData, comedoresData]) => {
      setEdificios(edificiosData.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre)));
      setComedores(comedoresData);
      setLoading(false);
    });
  }, [get]);

  const openCreate = () => { setEditing(null); setNombre(""); setComedorId(""); setModalOpen(true); };
  const openEdit = (e: any) => { setEditing(e); setNombre(e.nombre); setComedorId(String(e.comedorId)); setModalOpen(true); };

  const handleSave = async () => {
    if (!nombre.trim() || !comedorId) { toast.error("Completá todos los campos"); return; }
    setSaving(true);
    try {
      const body = { nombre: nombre.trim(), comedorId: Number(comedorId) };
      const res = editing
        ? await patch(`/eventos/edificios/${editing.id}`, body)
        : await post("/eventos/edificios", body);
      if (!res.ok) throw new Error();
      const saved = (await res.json());
      setEdificios((prev) => editing ? prev.map((e) => (e.id === saved.id ? saved : e)) : [...prev, saved]);
      toast.success(editing ? "Edificio actualizado" : "Edificio creado");
      setModalOpen(false);
    } catch { toast.error("Error al guardar"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  const comedorMap = new Map(comedores.map((c) => [c.id, c.nombre]));

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
              <h1 className="text-xl font-bold text-gray-800 uppercase">Edificios</h1>
              <p className="text-sm text-gray-500 mt-1">Gestioná los edificios del sistema</p>
            </CardTitle>
            <Button size="sm" onClick={openCreate} className="gap-2 font-bold">
              <Plus className="h-4 w-4" /> NUEVO
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            displayedCount={edificios.length}
            columns={<><th className="px-6 py-3">Comedor</th><th className="px-6 py-3">Nombre</th><th className="px-4 py-3 w-12" /></>}
            rows={edificios.map((e) => (
              <tr key={e.id} className="border-b hover:bg-gray-50/60">
                <td className="px-6 py-4 text-gray-600">{comedorMap.get(e.comedorId) ?? `ID ${e.comedorId}`}</td>
                <td className="px-6 py-4 font-medium">{e.nombre}</td>
                <td className="px-6 py-4 text-right"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(e)}><Pencil className="h-4 w-4" /></Button></td>
              </tr>
            ))}
          ></DataTable>
        </CardContent>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">{editing ? "Editar" : "Nuevo"} Edificio</h2>
            <div className="space-y-4">
              <div><label className="mb-1 block text-sm font-medium">Comedor</label>
                <select className="w-full h-10 px-3 border rounded-md text-sm bg-gray-50 border-gray-200" value={comedorId} onChange={(e) => setComedorId(e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {comedores.map((c) => <option key={c.id} value={String(c.id)}>{c.nombre}</option>)}
                </select>
              </div>
              <div><label className="mb-1 block text-sm font-medium">Nombre</label><Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del edificio" autoFocus /></div>
              <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button><Button onClick={handleSave} disabled={saving}>{saving ? <><Spinner className="mr-2 h-4 w-4" />Guardando...</> : "Guardar"}</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
