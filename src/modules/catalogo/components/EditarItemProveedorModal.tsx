import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useApi } from "@/hooks/useApi";
import type { ProveedorItemResponse } from "@/domain/dto/proveedor/ProveedorItemResponse";
import type { PatchProveedorItemRequest } from "@/domain/dto/proveedor/PatchProveedorItemRequest";

interface Props {
  open: boolean;
  onClose: () => void;
  item: ProveedorItemResponse | null;
  onSaved: (item: ProveedorItemResponse) => void;
}

export function EditarItemProveedorModal({ open, onClose, item, onSaved }: Props) {
  const { patch } = useApi();

  const [nombre, setNombre] = useState("");
  const [unidadMedida, setUnidadMedida] = useState("");
  const [precioUnitario, setPrecioUnitario] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!item) return;
    setNombre(item.nombre);
    setUnidadMedida(item.unidadMedida ?? "");
    setPrecioUnitario(String(item.precioUnitario));
  }, [item]);

  const canSave = !!nombre.trim() && Number(precioUnitario) > 0;

  const handleSave = async () => {
    if (!item || !canSave) return;
    setSaving(true);
    try {
      const body: PatchProveedorItemRequest = {
        nombre: nombre.trim(),
        unidadMedida: unidadMedida.trim() || null,
        precioUnitario: Number(precioUnitario),
      };
      const saved: ProveedorItemResponse = await patch(
        `/proveedores/${item.proveedorId}/items/${item.id}`,
        body,
      ).then((r) => r.json());
      toast("Artículo actualizado");
      onSaved(saved);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar el artículo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar artículo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Código</label>
            <Input value={item?.codigo ?? "—"} readOnly className="bg-gray-50 font-mono" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nombre / descripción *</label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Unidad de medida</label>
              <Input value={unidadMedida} onChange={(e) => setUnidadMedida(e.target.value)} placeholder="Ej: Litro, Kg, Unidad" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Precio unitario *</label>
              <Input type="number" min="0" value={precioUnitario} onChange={(e) => setPrecioUnitario(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!canSave || saving}>
              {saving ? <><Spinner className="mr-2 h-4 w-4" />Guardando...</> : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
