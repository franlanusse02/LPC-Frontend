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
import type { PuntoDeVentaResponse } from "@/domain/dto/pto-venta/PuntoDeVentaResponse";
import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";

type SortKey = "nombre" | "comedor";

export default function PuntosDeVentaPage() {
  const navigate = useNavigate();
  const { get, post, patch } = useApi();

  const [puntos, setPuntos] = useState<PuntoDeVentaResponse[]>([]);
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PuntoDeVentaResponse | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("nombre");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [nombre, setNombre] = useState("");
  const [comedorId, setComedorId] = useState("");

  useEffect(() => {
    Promise.all([
      get("/comedores/puntos-de-venta").then((r) => r.json()),
      get("/comedores").then((r) => r.json()),
    ]).then(([puntosData, comedoresData]) => {
      setPuntos(puntosData);
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

  const sorted = [...puntos].sort((a, b) => {
    const av =
      sortKey === "comedor"
        ? (comedores.find((c) => c.id === a.comedorId)?.nombre ?? "")
        : a.nombre;
    const bv =
      sortKey === "comedor"
        ? (comedores.find((c) => c.id === b.comedorId)?.nombre ?? "")
        : b.nombre;
    return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const comedorMap = new Map(comedores.map((c) => [c.id, c.nombre]));

  const openCreate = () => {
    setEditing(null);
    setNombre("");
    setComedorId("");
    setModalOpen(true);
  };
  const openEdit = (p: PuntoDeVentaResponse) => {
    setEditing(p);
    setNombre(p.nombre);
    setComedorId(String(p.comedorId));
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!nombre.trim() || !comedorId) {
      toast.error("Completá todos los campos");
      return;
    }
    setSaving(true);
    try {
      const body = { nombre: nombre.trim(), comedorId: Number(comedorId) };
      const res = editing
        ? await patch(`/comedores/puntos-de-venta/${editing.id}`, body)
        : await post("/comedores/puntos-de-venta", body);
      if (!res.ok) throw new Error();
      const saved = (await res.json()) as PuntoDeVentaResponse;
      setPuntos((prev) =>
        editing
          ? prev.map((p) => (p.id === saved.id ? saved : p))
          : [...prev, saved],
      );
      toast.success(
        editing ? "Punto de venta actualizado" : "Punto de venta creado",
      );
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
                Puntos de Venta
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Gestioná los puntos de venta
              </p>
            </CardTitle>
            <Button size="sm" onClick={openCreate} className="gap-2 font-bold">
              <Plus className="h-4 w-4" /> NUEVO
            </Button>
          </div>
        </CardHeader>{" "}
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
                  label="Comedor"
                  col="comedor"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <th className="px-4 py-3 w-12" />
              </>
            }
            rows={sorted.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50/60">
                <td className="px-6 py-4 font-medium">{p.nombre}</td>
                <td className="px-6 py-4 text-gray-600">
                  {comedorMap.get(p.comedorId) ?? `ID ${p.comedorId}`}
                </td>
                <td className="px-6 py-4 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(p)}
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
              {editing ? "Editar" : "Nuevo"} Punto de Venta
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Nombre</label>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre del punto de venta"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Comedor
                </label>
                <Select value={comedorId} onValueChange={setComedorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {comedores.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nombre}
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
