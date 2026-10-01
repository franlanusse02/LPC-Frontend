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
import { ApiError } from "@/lib/api-client";
import type { SavePlantillaOrdenDeCompraRequest } from "@/domain/dto/orden-compra/SavePlantillaOrdenDeCompraRequest";

export const NOMBRE_DUPLICADO = "Ya tenés una plantilla con ese nombre.";

interface Props {
  open: boolean;
  onClose: () => void;
  // Builds the request from the current orden form.
  buildRequest: (nombre: string) => SavePlantillaOrdenDeCompraRequest;
}

export function GuardarPlantillaModal({ open, onClose, buildRequest }: Props) {
  const { post } = useApi();
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNombre("");
    setError(null);
  }, [open]);

  const canSave = !!nombre.trim();

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await post("/ordenes-de-compra/plantillas", buildRequest(nombre.trim()));
      toast("Plantilla guardada", { description: nombre.trim() });
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setError(NOMBRE_DUPLICADO);
      else toast.error(err instanceof Error ? err.message : "No se pudo guardar la plantilla");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Guardar como plantilla</DialogTitle>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => { e.preventDefault(); handleSave(); }}
        >
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nombre *</label>
            <Input
              value={nombre}
              onChange={(e) => { setNombre(e.target.value); setError(null); }}
              placeholder="Ej: Pedido semanal verdulería"
              aria-invalid={!!error}
              autoFocus
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <p className="text-xs text-gray-400">Se guardan los datos y los ítems, sin fechas ni precios.</p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={!canSave || saving}>
              {saving ? <><Spinner className="mr-2 h-4 w-4" />Guardando...</> : "Guardar plantilla"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
