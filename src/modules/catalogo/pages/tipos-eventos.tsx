import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Plus, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { DataTable } from "@/components/data-table";
import { useApi } from "@/hooks/useApi";

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(n);

export default function TiposEventoPage() {
  const navigate = useNavigate();
  const { get, post, patch } = useApi();

  const [tipos, setTipos] = useState<any[]>([]);
  const [comedores, setComedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const [nombre, setNombre] = useState("");
  const [comedorId, setComedorId] = useState("");
  const [precio, setPrecio] = useState("");

  useEffect(() => {
    Promise.all([
      get("/eventos/tipos").then((r) => r.json()),
      get("/comedores").then((r) => r.json()),
    ]).then(([tiposData, comedoresData]) => {
      setTipos(tiposData.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre)));
      setComedores(comedoresData);
      setLoading(false);
    });
  }, [get]);

  const openCreate = () => { setEditing(null); setNombre(""); setComedorId(""); setPrecio(""); setModalOpen(true); };
  const openEdit = (t: any) => { setEditing(t); setNombre(t.nombre); setComedorId(String(t.comedorId)); setPrecio(t.precio != null ? String(t.precio) : ""); setModalOpen(true); };

  const handleSave = async () => {
    if (!nombre.trim() || !comedorId) { toast.error("Completá todos los campos"); return; }
    setSaving(true);
    try {
      const body = { nombre: nombre.trim(), comedorId: Number(comedorId), precio: precio ? Number(precio) : null };
      const res = editing
        ? await patch(`/eventos/tipos/${editing.id}`, body)
        : await post("/eventos/tipos", body);
      if (!res.ok) throw new Error();
      const saved = (await res.json());
      setTipos((prev) => editing ? prev.map((t) => (t.id === saved.id ? saved : t)) : [...prev, saved]);
      toast.success(editing ? "Tipo actualizado" : "Tipo de evento creado");
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
              <h1 className="text-xl font-bold text-gray-800 uppercase">Tipos de Evento</h1>
              <p className="text-sm text-gray-500 mt-1">Gestioná los tipos de evento y precios</p>
            </CardTitle>
            <Button size="sm" onClick={openCreate} className="gap-2 font-bold">
              <Plus className="h-4 w-4" /> NUEVO
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            displayedCount={tipos.length}
            columns={<><th className="px-6 py-3">Nombre</th><th className="px-6 py-3">Comedor</th><th className="px-6 py-3 text-right">Precio Unitario</th><th className="px-4 py-3 w-12" /></>}
            rows={tipos.map((t) => (
              <tr key={t.id} className="border-b hover:bg-gray-50/60">
                <td className="px-6 py-4 font-medium">{t.nombre}</td>
                <td className="px-6 py-4 text-gray-600">{comedorMap.get(t.comedorId) ?? `ID ${t.comedorId}`}</td>
                <td className="px-6 py-4 text-right font-mono text-gray-600">{t.precio != null ? fmtCurrency(t.precio) : "—"}</td>
                <td className="px-6 py-4 text-right"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button></td>
              </tr>
            ))}
          ></DataTable>
        </CardContent>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">{editing ? "Editar" : "Nuevo"} Tipo de Evento</h2>
            <div className="space-y-4">
              <div><label className="mb-1 block text-sm font-medium">Comedor</label>
                <select className="w-full h-10 px-3 border rounded-md text-sm bg-gray-50 border-gray-200" value={comedorId} onChange={(e) => setComedorId(e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {comedores.map((c) => <option key={c.id} value={String(c.id)}>{c.nombre}</option>)}
                </select>
              </div>
              <div><label className="mb-1 block text-sm font-medium">Nombre</label><Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del tipo" autoFocus /></div>
              <div><label className="mb-1 block text-sm font-medium">Precio Unitario <span className="text-gray-400 font-normal">(opcional)</span></label><Input type="number" min="0" step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="0.00" /></div>
              <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button><Button onClick={handleSave} disabled={saving}>{saving ? <><Spinner className="mr-2 h-4 w-4" />Guardando...</> : "Guardar"}</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
