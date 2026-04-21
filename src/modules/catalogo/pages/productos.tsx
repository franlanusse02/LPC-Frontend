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
import { ConfirmarAnulacion } from "../components/ConfirmarAnulacion";
import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";

type SortKey = "nombre" | "comedor" | "precio";

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(n);

export default function ProductosPage() {
  const navigate = useNavigate();
  const { get, post, patch } = useApi();

  const [productos, setProductos] = useState<any[]>([]);
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [anularModalOpen, setAnularModalOpen] = useState(false);
  const [anularProducto, setAnularProducto] = useState<any | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("nombre");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [nombre, setNombre] = useState("");
  const [comedorId, setComedorId] = useState("");
  const [precio, setPrecio] = useState("");

  useEffect(() => {
    Promise.all([
      get("/consumos/productos").then((r) => r.json()),
      get("/comedores").then((r) => r.json()),
    ]).then(([productosData, comedoresData]) => {
      setProductos(productosData);
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

  const sorted = [...productos].sort((a, b) => {
    const av =
      sortKey === "comedor"
        ? (comedores.find((c) => c.id === a.comedorId)?.nombre ?? "")
        : sortKey === "precio"
          ? a.precio
          : a.nombre;
    const bv =
      sortKey === "comedor"
        ? (comedores.find((c) => c.id === b.comedorId)?.nombre ?? "")
        : sortKey === "precio"
          ? b.precio
          : b.nombre;
    return sortDir === "asc"
      ? av.localeCompare(String(bv))
      : String(bv).localeCompare(av);
  });

  const comedorMap = new Map(comedores.map((c) => [c.id, c.nombre]));

  const openCreate = () => {
    setEditing(null);
    setNombre("");
    setComedorId("");
    setPrecio("");
    setModalOpen(true);
  };
  const openEdit = (p: any) => {
    setEditing(p);
    setNombre(p.nombre);
    setComedorId(String(p.comedorId));
    setPrecio(String(p.precio));
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!nombre.trim() || !comedorId || !precio || Number(precio) <= 0) {
      toast.error("Completá todos los campos");
      return;
    }
    setSaving(true);
    try {
      const body = {
        nombre: nombre.trim(),
        comedorId: Number(comedorId),
        precio: Number(precio),
      };
      const res = editing
        ? await patch(`/consumos/productos/${editing.productoId}`, body)
        : await post("/consumos/productos", body);
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setProductos((prev) =>
        editing
          ? prev.map((p) => (p.productoId === saved.productoId ? saved : p))
          : [...prev, saved],
      );
      toast.success(editing ? "Producto actualizado" : "Producto creado");
      setModalOpen(false);
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (p: any) => {
    setAnularProducto(p);
    setAnularModalOpen(true);
  };

  const handleAnularSuccess = () => {
    if (!anularProducto) return;
    setProductos((prev) =>
      prev.map((item) =>
        item.productoId === anularProducto?.productoId
          ? { ...item, activo: false }
          : item,
      ),
    );
  };

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );

  return (
    <div className="py-8">
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
                Productos
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Gestioná el catálogo de productos
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
                  label="Comedor"
                  col="comedor"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Precio"
                  col="precio"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="text-right"
                />
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 w-20" />
              </>
            }
            rows={sorted.map((p) => (
              <tr
                key={p.productoId}
                className={cn(
                  "border-b transition-colors",
                  !p.activo && "bg-red-50/30 text-gray-400",
                )}
              >
                <td className="px-6 py-4 font-medium">{p.nombre}</td>
                <td className="px-6 py-4 text-gray-600">
                  {comedorMap.get(p.comedorId) ?? `ID ${p.comedorId}`}
                </td>
                <td className="px-6 py-4 text-right font-mono">
                  {fmtCurrency(p.precio)}
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      p.activo
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-600",
                    )}
                  >
                    {p.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(p)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {p.activo && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500"
                        onClick={() => handleDelete(p)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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
              {editing ? "Editar" : "Nuevo"} Producto
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Nombre</label>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre del producto"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Comedor
                </label>
                <select
                  className="w-full h-10 px-3 border rounded-md text-sm bg-gray-50 border-gray-200"
                  value={comedorId}
                  onChange={(e) => setComedorId(e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {comedores.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Precio</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  placeholder="0.00"
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

      <ConfirmarAnulacion
        open={anularModalOpen}
        onOpenChange={setAnularModalOpen}
        producto={anularProducto}
        onSuccess={handleAnularSuccess}
      />
    </div>
  );
}
