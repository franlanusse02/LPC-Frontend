import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { DataTable, SortableTh } from "@/components/data-table";
import { useApi } from "@/hooks/useApi";
import type { SociedadResponse } from "../types/SociedadResponse";

type SortKey = "nombre" | "direccion" | "cuit";

export default function SociedadesPage() {
  const navigate = useNavigate();
  const { get, post, patch } = useApi();

  const [sociedades, setSociedades] = useState<SociedadResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SociedadResponse | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("nombre");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [cuit, setCuit] = useState("");

  useEffect(() => {
    get("/sociedades")
      .then((r) => r.json())
      .then((data) => {
        setSociedades(data);
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

  const sorted = [...sociedades].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const openCreate = () => {
    setEditing(null);
    setNombre("");
    setDireccion("");
    setCuit("");
    setModalOpen(true);
  };
  const openEdit = (s: SociedadResponse) => {
    setEditing(s);
    setNombre(s.nombre);
    setDireccion(s.direccion);
    setCuit(s.cuit);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!nombre.trim() || !direccion.trim() || !cuit.trim()) {
      toast.error("Completá todos los campos");
      return;
    }
    setSaving(true);
    try {
      const body = {
        nombre: nombre.trim(),
        direccion: direccion.trim(),
        cuit: cuit.trim(),
      };
      const res = editing
        ? await patch(`/sociedades/${editing.id}`, body)
        : await post("/sociedades", body);
      if (!res.ok) throw new Error();
      const saved = (await res.json()) as SociedadResponse;
      setSociedades((prev) =>
        editing ? prev.map((s) => (s.id === saved.id ? saved : s)) : [...prev, saved],
      );
      toast.success(editing ? "Sociedad actualizada" : "Sociedad creada");
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
                Sociedades
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Gestioná las sociedades del sistema
              </p>
            </CardTitle>
            <Button size="sm" onClick={openCreate} className="gap-2 font-bold">
              <Plus className="h-4 w-4" /> NUEVO
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
              <Building2 className="h-8 w-8" />
              <p className="text-sm">No hay sociedades registradas</p>
            </div>
          ) : (
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
                    label="Dirección"
                    col="direccion"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableTh
                    label="CUIT"
                    col="cuit"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <th className="px-4 py-3 w-12" />
                </>
              }
              rows={sorted.map((s) => (
                <tr key={s.id} className="border-b hover:bg-gray-50/60">
                  <td className="px-6 py-4 font-medium">{s.nombre}</td>
                  <td className="px-6 py-4 text-gray-600">{s.direccion}</td>
                  <td className="px-6 py-4 font-mono text-sm text-gray-600">{s.cuit}</td>
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
          )}
        </CardContent>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">
              {editing ? "Editar" : "Nueva"} Sociedad
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Nombre</label>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre de la sociedad"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Dirección
                </label>
                <Input
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Dirección"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">CUIT</label>
                <Input
                  value={cuit}
                  onChange={(e) => setCuit(e.target.value)}
                  placeholder="CUIT"
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
    </div>
  );
}
