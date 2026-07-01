import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Ban, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { DataTable } from "@/components/data-table";
import { StatCard } from "@/modules/cierres/components/CierreStat";
import { NuevoItemProveedorModal } from "@/modules/compras/components/NuevoItemProveedorModal";
import { EditarItemProveedorModal } from "../components/EditarItemProveedorModal";
import { useApi } from "@/hooks/useApi";
import { cn, fmtCurrency } from "@/lib/utils";
import type { ProveedorResponse } from "@/domain/dto/proveedor/ProveedorResponse";
import type { ProveedorItemResponse } from "@/domain/dto/proveedor/ProveedorItemResponse";
import type { PagedResponse } from "@/domain/dto/common/PagedResponse";

export default function ProveedorItemsPage() {
  const navigate = useNavigate();
  const { get, patch } = useApi();

  const [proveedores, setProveedores] = useState<ProveedorResponse[]>([]);
  const [proveedorId, setProveedorId] = useState("");
  const [items, setItems] = useState<ProveedorItemResponse[]>([]);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ProveedorItemResponse | null>(null);

  useEffect(() => {
    get("/proveedores").then((r) => r.json()).then(setProveedores);
  }, [get]);

  useEffect(() => {
    if (!proveedorId) return;
    get(`/proveedores/${proveedorId}/items`)
      .then((r) => r.json())
      .then((data: ProveedorItemResponse[]) => setItems(Array.isArray(data) ? data : []));
  }, [proveedorId, get]);

  // No proveedor selected → search across all proveedores (query-only, page 0).
  useEffect(() => {
    if (proveedorId) return;
    const q = search.trim();
    if (q.length < 2) { setItems([]); return; }
    const t = setTimeout(() => {
      get(`/articulos/codificacion/items?q=${encodeURIComponent(q)}&page=0`)
        .then((r) => r.json())
        .then((d: PagedResponse<ProveedorItemResponse>) =>
          setItems(Array.isArray(d?.content) ? d.content : []));
    }, 250);
    return () => clearTimeout(t);
  }, [proveedorId, search, get]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        (i.codigo ?? "").toLowerCase().includes(q) ||
        i.nombre.toLowerCase().includes(q),
    );
  }, [items, search]);

  const activos = items.filter((i) => i.activo).length;
  const inactivos = items.length - activos;
  const globalMode = !proveedorId;
  const showTable = !!proveedorId || search.trim().length >= 2;

  const handleDesactivar = async (item: ProveedorItemResponse) => {
    try {
      const updated: ProveedorItemResponse = await patch(
        `/proveedores/${item.proveedorId}/items/${item.id}/desactivar`,
        {},
      ).then((r) => r.json());
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      toast("Artículo desactivado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo desactivar el artículo");
    }
  };

  const onCreated = (item: ProveedorItemResponse) => setItems((prev) => [...prev, item]);
  const onSaved = (item: ProveedorItemResponse) =>
    setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));

  return (
    <div className="px-4 sm:px-8 lg:px-18 py-8">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
      </div>

      <div className="mx-auto max-w-7xl grid grid-cols-2 gap-4 sm:grid-cols-3 pb-4 pt-2">
        <StatCard label="Total artículos" value={items.length} />
        <StatCard label="Activos" value={activos} accent="emerald" />
        <StatCard label="Inactivos" value={inactivos} accent="red" />
      </div>

      <Card className="mx-auto max-w-7xl border-0 shadow-md">
        <CardHeader className="border-b px-6 py-4">
          <div className="flex flex-row justify-between w-full items-start gap-4">
            <CardTitle className="tracking-wide">
              <h1 className="text-xl font-bold text-gray-800 uppercase">Artículos Proveedor</h1>
              <p className="text-sm text-gray-500 mt-1">Gestioná los artículos de cada proveedor</p>
            </CardTitle>
            <Button size="sm" onClick={() => setCreating(true)} disabled={!proveedorId} className="gap-2 font-bold">
              <Plus className="h-4 w-4" /> NUEVO
            </Button>
          </div>
          <div className="pt-3 flex flex-wrap items-center gap-2">
            <Combobox
              options={proveedores.map((p) => ({ value: String(p.id), label: p.nombre }))}
              value={proveedorId}
              onChange={setProveedorId}
              placeholder="Seleccionar proveedor..."
              className="w-72"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={proveedorId ? "Filtrar por código o nombre..." : "Buscar en todos los proveedores..."}
              className="h-8 w-64 px-3 text-sm bg-gray-50 border border-gray-200 rounded-md disabled:opacity-50"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!showTable ? (
            <p className="py-16 text-center text-sm text-gray-400">
              Seleccioná un proveedor, o buscá un artículo por código/nombre en todos los proveedores.
            </p>
          ) : (
            <DataTable
              displayedCount={filtered.length}
              columns={
                <>
                  <th className="px-6 py-3">Código</th>
                  <th className="px-6 py-3">Nombre</th>
                  {globalMode && <th className="px-6 py-3">Proveedor</th>}
                  <th className="px-6 py-3">U.M.</th>
                  <th className="px-6 py-3 text-right">Precio unit.</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-4 py-3 w-20" />
                </>
              }
              rows={filtered.map((item) => (
                <tr key={item.id} className={cn("border-b hover:bg-gray-50/60", !item.activo && "bg-red-50/30 text-gray-400")}>
                  <td className="px-6 py-4 font-mono text-sm text-gray-600">{item.codigo ?? "—"}</td>
                  <td className="px-6 py-4 font-medium">{item.nombre}</td>
                  {globalMode && <td className="px-6 py-4 text-gray-600">{item.proveedorNombre ?? "—"}</td>}
                  <td className="px-6 py-4 text-gray-600">{item.unidadMedida ?? "—"}</td>
                  <td className="px-6 py-4 text-right font-mono">{fmtCurrency(item.precioUnitario)}</td>
                  <td className="px-6 py-4">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", item.activo ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600")}>
                      {item.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(item)} aria-label="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {item.activo && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={() => handleDesactivar(item)} aria-label="Desactivar">
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            />
          )}
        </CardContent>
      </Card>

      {proveedorId && (
        <NuevoItemProveedorModal
          open={creating}
          onClose={() => setCreating(false)}
          proveedorId={Number(proveedorId)}
          onCreated={onCreated}
        />
      )}
      <EditarItemProveedorModal
        open={!!editing}
        onClose={() => setEditing(null)}
        item={editing}
        onSaved={onSaved}
      />
    </div>
  );
}
