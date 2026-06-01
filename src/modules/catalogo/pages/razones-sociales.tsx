import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Spinner } from "@/components/ui/spinner";
import { DataTable, SortableTh } from "@/components/data-table";
import { useApi } from "@/hooks/useApi";
import type { RazonSocialComedorResponse } from "@/domain/dto/comedor/RazonSocialComedorResponse";
import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";

type SortKey = "nombre" | "comedor" | "taxId";

export default function RazonesSocialesPage() {
  const navigate = useNavigate();
  const { get, post, patch, del } = useApi();

  const [razones, setRazones] = useState<RazonSocialComedorResponse[]>([]);
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RazonSocialComedorResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RazonSocialComedorResponse | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("nombre");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [nombre, setNombre] = useState("");
  const [comedorId, setComedorId] = useState("");
  const [taxId, setTaxId] = useState("");

  useEffect(() => {
    Promise.all([
      get("/comedores/razon-social").then((r) => r.json()),
      get("/comedores").then((r) => r.json()),
    ]).then(([razonesData, comedoresData]) => {
      setRazones(razonesData);
      setComedores(comedoresData);
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

  const sorted = [...razones].sort((a, b) => {
    const av =
      sortKey === "comedor"
        ? (comedores.find((c) => c.id === a.comedorId)?.nombre ?? "")
        : String(a[sortKey] ?? "");
    const bv =
      sortKey === "comedor"
        ? (comedores.find((c) => c.id === b.comedorId)?.nombre ?? "")
        : String(b[sortKey] ?? "");
    return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const comedorMap = new Map(comedores.map((c) => [c.id, c.nombre]));

  const openCreate = () => {
    setEditing(null);
    setNombre("");
    setComedorId("");
    setTaxId("");
    setModalOpen(true);
  };

  const openEdit = (r: RazonSocialComedorResponse) => {
    setEditing(r);
    setNombre(r.nombre);
    setComedorId(String(r.comedorId));
    setTaxId(r.taxId ? String(r.taxId) : "");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!nombre.trim() || !comedorId) {
      toast.error("Completá el nombre y el comedor de la razón social.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        nombre: nombre.trim(),
        comedorId: Number(comedorId),
        taxId: taxId ? Number(taxId) : null,
      };
      const res = editing
        ? await patch(`/comedores/razon-social/${editing.id}`, body)
        : await post("/comedores/razon-social", body);
      const saved = (await res.json()) as RazonSocialComedorResponse;
      setRazones((prev) =>
        editing
          ? prev.map((r) => (r.id === saved.id ? saved : r))
          : [...prev, saved],
      );
      toast.success(editing ? "Razón social actualizada" : "Razón social creada");
      setModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la razón social.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await del(`/comedores/razon-social/${deleteTarget.id}`);
      setRazones((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      toast.success("Razón social eliminada");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar la razón social.");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );

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
              <h1 className="text-xl font-bold text-gray-800 uppercase">
                Razones Sociales
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Gestioná las razones sociales de los comedores
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
                <SortableTh label="Nombre" col="nombre" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh label="Comedor" col="comedor" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh label="CUIT" col="taxId" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 w-20" />
              </>
            }
            rows={sorted.map((r) => (
              <tr key={r.id} className="border-b hover:bg-gray-50/60">
                <td className="px-6 py-4 font-medium">{r.nombre}</td>
                <td className="px-6 py-4 text-gray-600">
                  {comedorMap.get(r.comedorId) ?? `ID ${r.comedorId}`}
                </td>
                <td className="px-6 py-4 font-mono text-sm">{r.taxId ?? "—"}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => setDeleteTarget(r)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
            <h2 className="mb-4 text-lg font-bold">
              {editing ? "Editar" : "Nueva"} Razón Social
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Comedor</label>
                <Combobox
                  options={comedores.map((c) => ({ value: String(c.id), label: c.nombre }))}
                  value={comedorId}
                  onChange={setComedorId}
                  placeholder="Seleccionar..."
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Nombre</label>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Razón social"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  CUIT{" "}
                  <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <Input
                  value={taxId}
                  onChange={(e) =>
                    setTaxId(e.target.value.replace(/\D/g, "").slice(0, 11))
                  }
                  placeholder="CUIT"
                  inputMode="numeric"
                />
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

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-2 text-lg font-bold">Eliminar Razón Social</h2>
            <p className="mb-4 text-sm text-gray-600">
              ¿Eliminar <strong>{deleteTarget.nombre}</strong>? Esta acción no
              se puede deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancelar
              </Button>
              <Button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
