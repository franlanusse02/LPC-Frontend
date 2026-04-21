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

export default function ProveedoresPage() {
  const navigate = useNavigate();
  const { get, post, patch } = useApi();

  const [proveedores, setProveedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const [nombre, setNombre] = useState("");
  const [taxId, setTaxId] = useState("");

  useEffect(() => {
    get("/proveedores")
      .then((r) => r.json())
      .then((data) => { setProveedores(data); setLoading(false); });
  }, [get]);

  const openCreate = () => { setEditing(null); setNombre(""); setTaxId(""); setModalOpen(true); };
  const openEdit = (p: any) => { setEditing(p); setNombre(p.nombre); setTaxId(p.taxId); setModalOpen(true); };

  const handleSave = async () => {
    if (!nombre.trim() || !taxId.trim()) { toast.error("Completá todos los campos"); return; }
    setSaving(true);
    try {
      const body = { nombre: nombre.trim(), taxId: taxId.trim() };
      const res = editing
        ? await patch(`/proveedores/${editing.id}`, body)
        : await post("/proveedores", body);
      if (!res.ok) throw new Error();
      const saved = (await res.json());
      setProveedores((prev) => editing ? prev.map((p) => (p.id === saved.id ? saved : p)) : [...prev, saved]);
      toast.success(editing ? "Proveedor actualizado" : "Proveedor creado");
      setModalOpen(false);
    } catch { toast.error("Error al guardar"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

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
              <h1 className="text-xl font-bold text-gray-800 uppercase">Proveedores</h1>
              <p className="text-sm text-gray-500 mt-1">Gestioná los proveedores del sistema</p>
            </CardTitle>
            <Button size="sm" onClick={openCreate} className="gap-2 font-bold">
              <Plus className="h-4 w-4" /> NUEVO
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            displayedCount={proveedores.length}
            columns={<><th className="px-6 py-3">Nombre</th><th className="px-6 py-3">Tax ID</th><th className="px-4 py-3 w-12" /></>}
            rows={proveedores.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50/60">
                <td className="px-6 py-4 font-medium">{p.nombre}</td>
                <td className="px-6 py-4 font-mono text-sm text-gray-600">{p.taxId}</td>
                <td className="px-6 py-4 text-right"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button></td>
              </tr>
            ))}
          ></DataTable>
        </CardContent>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">{editing ? "Editar" : "Nuevo"} Proveedor</h2>
            <div className="space-y-4">
              <div><label className="mb-1 block text-sm font-medium">Nombre</label><Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del proveedor" autoFocus /></div>
              <div><label className="mb-1 block text-sm font-medium">Tax ID</label><Input value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="Tax ID" /></div>
              <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button><Button onClick={handleSave} disabled={saving}>{saving ? <><Spinner className="mr-2 h-4 w-4" />Guardando...</> : "Guardar"}</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
