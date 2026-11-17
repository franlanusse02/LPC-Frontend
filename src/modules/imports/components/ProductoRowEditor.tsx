import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useApi } from "@/hooks/useApi";
import type { PatchImportRowProductoRequest } from "@/domain/dto/imports/productos/PatchImportRowProductoRequest";
import type { ImportRow } from "../config/sharedTypes";

type Comedor = { id: number; nombre: string };

type Props = {
  basePath: string;
  row: ImportRow | null;
  onClose: () => void;
  onSaved: () => void;
};

const str = (v: unknown) => (v == null ? "" : String(v));

/**
 * Edits a productos import row the user has taken. Saving PATCHes the row and revalidates it,
 * so the user sees right away whether it is ready to apply.
 */
export function ProductoRowEditor({ basePath, row, onClose, onSaved }: Props) {
  const { get, patch, post } = useApi();
  const [comedores, setComedores] = useState<Comedor[]>([]);
  const [productoId, setProductoId] = useState("");
  const [comedorId, setComedorId] = useState("");
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [sapId, setSapId] = useState("");
  const [activo, setActivo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    get("/catalogo/comedores")
      .then((r) => r.json())
      .then((data) => setComedores(Array.isArray(data) ? data : []))
      .catch(() => setComedores([]));
  }, [get]);

  useEffect(() => {
    if (!row) return;
    setProductoId(str(row.productoId));
    setComedorId(str(row.comedorId));
    setNombre(str(row.nombre));
    setPrecio(str(row.precio));
    setSapId(str(row.sapId));
    setActivo(row.activo == null ? "" : row.activo ? "true" : "false");
  }, [row]);

  const handleSave = async () => {
    if (!row) return;
    const precioNum = precio.trim() === "" ? null : Number(precio.replace(",", "."));
    const idNum = productoId.trim() === "" ? null : Number(productoId);
    if (precioNum != null && !Number.isFinite(precioNum)) {
      toast.error("El precio no es un número válido.");
      return;
    }
    if (idNum != null && !Number.isInteger(idNum)) {
      toast.error("El ID tiene que ser un número entero.");
      return;
    }
    const body: PatchImportRowProductoRequest = {
      version: row.version,
      productoId: idNum,
      comedorId: comedorId ? Number(comedorId) : null,
      nombre: nombre.trim() || null,
      precio: precioNum,
      sapId: sapId.trim() || null,
      activo: activo === "" ? null : activo === "true",
    };
    setSaving(true);
    try {
      const saved = (await (await patch(`${basePath}/rows/${row.id}`, body)).json()) as ImportRow;
      const revalidated = (await (
        await post(`${basePath}/rows/${row.id}/revalidar`, { version: saved.version })
      ).json()) as ImportRow;
      toast(revalidated.estado === "READY" ? "Fila lista para aplicar" : "Fila guardada, todavía tiene errores");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la fila.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={row != null} onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar fila {row?.rowIndex}</DialogTitle>
          <DialogDescription>
            Con ID se actualiza ese producto. Sin ID, si el nombre coincide con un producto del
            comedor se actualiza ese; si no, se crea uno nuevo.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">ID</span>
            <Input value={productoId} onChange={(e) => setProductoId(e.target.value)} inputMode="numeric" placeholder="Vacío = nuevo" />
          </label>
          <div className="space-y-1 text-sm">
            <span className="font-medium">Comedor</span>
            <Combobox
              options={comedores.map((c) => ({ value: String(c.id), label: c.nombre }))}
              value={comedorId}
              onChange={setComedorId}
              placeholder="Seleccionar comedor..."
            />
          </div>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="font-medium">Nombre</span>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Precio</span>
            <Input value={precio} onChange={(e) => setPrecio(e.target.value)} inputMode="decimal" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">SAP ID</span>
            <Input value={sapId} onChange={(e) => setSapId(e.target.value)} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Activo</span>
            <select
              value={activo}
              onChange={(e) => setActivo(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">Sin cambio</option>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Spinner className="mr-1" /> : null}
            Guardar y revalidar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
