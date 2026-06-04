import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Spinner } from "@/components/ui/spinner";
import { DataTable, SortableTh } from "@/components/data-table";
import { useApi } from "@/hooks/useApi";
import type { CentroCostoResponse } from "@/domain/dto/catalogo/CentroCostoResponse";
import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";

type SortKey = "nombre" | "comedor";

export default function CentrosCostoPage() {
  const navigate = useNavigate();
  const { get, post, patch } = useApi();

  const [items, setItems] = useState<CentroCostoResponse[]>([]);
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CentroCostoResponse | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("nombre");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [nombre, setNombre] = useState("");
  const [comedorId, setComedorId] = useState("");

  useEffect(() => {
    Promise.all([
      get("/comedores/centros-costo").then((r) => r.json()),
      get("/comedores").then((r) => r.json()),
    ]).then(([data, comedoresData]) => {
      setItems(data);
      setComedores(comedoresData);
      setLoading(false);
    });
  }, [get]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const comedorMap = new Map(comedores.map((c) => [c.id, c.nombre]));

  const sorted = [...items].sort((a, b) => {
    const av = sortKey === "comedor" ? (comedorMap.get(a.comedorId) ?? "") : a.nombre;
    const bv = sortKey === "comedor" ? (comedorMap.get(b.comedorId) ?? "") : b.nombre;
    return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const openCreate = () => {
    setEditing(null);
    setNombre("");
    setComedorId("");
    setModalOpen(true);
  };

  const openEdit = (item: CentroCostoResponse) => {
    setEditing(item);
    setNombre(item.nombre);
    setComedorId(String(item.comedorId));
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!nombre.trim() || !comedorId) {
      toast.error("Completá el nombre y el comedor.");
      return;
    }
    setSaving(true);
    try {
      const res = editing
        ? await patch(`/comedores/centros-costo/${editing.id}`, { nombre: nombre.trim() })
        : await post("/comedores/centros-costo", { nombre: nombre.trim(), comedorId: Number(comedorId) });
      const saved = (await res.json()) as CentroCostoResponse;
      setItems((prev) =>
        editing ? prev.map((i) => (i.id === saved.id ? saved : i)) : [...prev, saved],
      );
      toast.success(editing ? "Centro de costo actualizado" : "Centro de costo creado");
      setModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActivo = async (item: CentroCostoResponse) => {
    try {
      const res = await patch(`/comedores/centros-costo/${item.id}`, { activo: !item.activo });
      const saved = (await res.json()) as CentroCostoResponse;
      setItems((prev) => prev.map((i) => (i.id === saved.id ? saved : i)));
      toast.success(saved.activo ? "Activado" : "Desactivado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar.");
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div className="px-4 sm:px-8 lg:px-18 py-8">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
      </div>

      <Card className="mx-auto max-w-7xl border-0 shadow-md mt-4">
        <CardHeader className="border-b px-6 py-4">
          <div className="flex flex-row justify-between w-full">
            <CardTitle className="tracking-wide">
              <h1 className="text-xl font-bold text-gray-800 uppercase">Centros de Costo</h1>
              <p className="text-sm text-gray-500 mt-1">Gestioná los centros de costo por comedor</p>
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
                <th className="px-6 py-3 text-center">Estado</th>
                <th className="px-4 py-3 w-12" />
              </>
            }
            rows={sorted.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50/60">
                <td className="px-6 py-4 font-medium">{item.nombre}</td>
                <td className="px-6 py-4 text-gray-600">{comedorMap.get(item.comedorId) ?? `ID ${item.comedorId}`}</td>
                <td className="px-6 py-4 text-center">
                  <button
                    type="button"
                    onClick={() => handleToggleActivo(item)}
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold cursor-pointer transition-colors",
                      item.activo ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-red-100 text-red-600 hover:bg-red-200",
                    )}
                  >
                    {item.activo ? "Activo" : "Inactivo"}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          />
        </CardContent>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">{editing ? "Editar" : "Nuevo"} Centro de Costo</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Comedor</label>
                <Combobox
                  options={comedores.map((c) => ({ value: String(c.id), label: c.nombre }))}
                  value={comedorId}
                  onChange={setComedorId}
                  placeholder="Seleccionar..."
                  disabled={!!editing}
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Nombre</label>
                <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del centro de costo" autoFocus />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <><Spinner className="mr-2 h-4 w-4" />Guardando...</> : "Guardar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
