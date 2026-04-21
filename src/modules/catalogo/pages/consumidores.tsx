import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { DataTable, SortableTh } from "@/components/data-table";
import { useApi } from "@/hooks/useApi";
import type { ComedorResponse } from "../types/ComedorResponse";

type SortKey = "nombre" | "comedor" | "taxId";

export default function ConsumidoresPage() {
  const navigate = useNavigate();
  const { get, post, patch, del } = useApi();

  const [consumidores, setConsumidores] = useState<any[]>([]);
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("nombre");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [nombre, setNombre] = useState("");
  const [comedorId, setComedorId] = useState("");
  const [taxId, setTaxId] = useState("");
  const [posicion, setPosicion] = useState("");

  useEffect(() => {
    Promise.all([
      get("/consumos/consumidores/all").then((r) => r.json()),
      get("/comedores").then((r) => r.json()),
    ]).then(([consumidoresData, comedoresData]) => {
      setConsumidores(consumidoresData);
      setComedores(comedoresData);
      setLoading(false);
    });
  }, [get]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const sorted = [...consumidores.filter((c) => c.activo)].sort((a, b) => {
    const av = sortKey === "comedor" ? (comedores.find((c) => c.id === a.comedorId)?.nombre ?? "") : String(a[sortKey] ?? "");
    const bv = sortKey === "comedor" ? (comedores.find((c) => c.id === b.comedorId)?.nombre ?? "") : String(b[sortKey] ?? "");
    return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const comedorMap = new Map(comedores.map((c) => [c.id, c.nombre]));

  const openCreate = () => { setEditing(null); setNombre(""); setComedorId(""); setTaxId(""); setPosicion(""); setModalOpen(true); };
  const openEdit = (c: any) => { setEditing(c); setNombre(c.nombre); setComedorId(String(c.comedorId)); setTaxId(String(c.taxId)); setPosicion(c.posicion ?? ""); setModalOpen(true); };

  const handleSave = async () => {
    if (!nombre.trim() || !comedorId || !taxId.trim()) { toast.error("Completá todos los campos"); return; }
    setSaving(true);
    try {
      const body = { nombre: nombre.trim(), comedorId: Number(comedorId), taxId: Number(taxId), posicion: posicion.trim() || undefined };
      const res = editing
        ? await patch(`/consumos/consumidores/${editing.id}`, body)
        : await post("/consumos/consumidores", body);
      if (!res.ok) throw new Error();
      const saved = (await res.json());
      setConsumidores((prev) => editing ? prev.map((c) => (c.id === saved.id ? saved : c)) : [...prev, saved]);
      toast.success(editing ? "Consumidor actualizado" : "Consumidor creado");
      setModalOpen(false);
    } catch { toast.error("Error al guardar"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await del(`/consumos/consumidores/${deleteTarget.id}`);
      setConsumidores((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast.success("Consumidor eliminado");
      setDeleteTarget(null);
    } catch { toast.error("Error al eliminar"); }
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
              <h1 className="text-xl font-bold text-gray-800 uppercase">Consumidores</h1>
              <p className="text-sm text-gray-500 mt-1">Gestioná los consumidores del sistema</p>
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
                <SortableTh label="Nombre" col="nombre" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh label="Comedor" col="comedor" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh label="DNI" col="taxId" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3">Posición</th>
                <th className="px-4 py-3 w-20" />
              </>
            }
            rows={sorted.map((c) => (
              <tr key={c.id} className="border-b hover:bg-gray-50/60">
                <td className="px-6 py-4 font-medium">{c.nombre}</td>
                <td className="px-6 py-4 text-gray-600">{comedorMap.get(c.comedorId) ?? `ID ${c.comedorId}`}</td>
                <td className="px-6 py-4 font-mono text-sm">{c.taxId}</td>
                <td className="px-6 py-4 text-gray-500">{c.posicion ?? "—"}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => setDeleteTarget(c)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          ></DataTable>
        </CardContent>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">{editing ? "Editar" : "Nuevo"} Consumidor</h2>
            <div className="space-y-4">
              <div><label className="mb-1 block text-sm font-medium">Nombre</label><Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre completo" autoFocus /></div>
              <div><label className="mb-1 block text-sm font-medium">Comedor</label>
                <select className="w-full h-10 px-3 border rounded-md text-sm bg-gray-50 border-gray-200" value={comedorId} onChange={(e) => setComedorId(e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {comedores.map((c) => <option key={c.id} value={String(c.id)}>{c.nombre}</option>)}
                </select>
              </div>
              <div><label className="mb-1 block text-sm font-medium">DNI</label><Input value={taxId} onChange={(e) => setTaxId(e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="DNI" inputMode="numeric" /></div>
              <div><label className="mb-1 block text-sm font-medium">Posición</label><Input value={posicion} onChange={(e) => setPosicion(e.target.value)} placeholder="Ej: Analista" /></div>
              <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button><Button onClick={handleSave} disabled={saving}>{saving ? <><Spinner className="mr-2 h-4 w-4" />Guardando...</> : "Guardar"}</Button></div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-2 text-lg font-bold">Eliminar Consumidor</h2>
            <p className="mb-4 text-sm text-gray-600">¿Eliminar a <strong>{deleteTarget.nombre}</strong>? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
              <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Eliminar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
