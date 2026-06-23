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
import { Combobox } from "@/components/ui/combobox";
import { Spinner } from "@/components/ui/spinner";
import { useApi } from "@/hooks/useApi";
import type { GrupoArticuloResponse } from "@/domain/dto/proveedor/GrupoArticuloResponse";
import type { FamiliaArticuloResponse } from "@/domain/dto/proveedor/FamiliaArticuloResponse";
import type { ProveedorItemResponse } from "@/domain/dto/proveedor/ProveedorItemResponse";
import type { CreateProveedorItemRequest } from "@/domain/dto/proveedor/CreateProveedorItemRequest";

interface Props {
  open: boolean;
  onClose: () => void;
  proveedorId: number;
  onCreated: (item: ProveedorItemResponse) => void;
}

export function NuevoItemProveedorModal({ open, onClose, proveedorId, onCreated }: Props) {
  const { get, post } = useApi();

  const [grupos, setGrupos] = useState<GrupoArticuloResponse[]>([]);
  const [familias, setFamilias] = useState<FamiliaArticuloResponse[]>([]);
  const [grupo, setGrupo] = useState("");
  const [familia, setFamilia] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [unidadMedida, setUnidadMedida] = useState("");
  const [precioUnitario, setPrecioUnitario] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setGrupo(""); setFamilia(""); setCodigo("");
    setNombre(""); setUnidadMedida(""); setPrecioUnitario("");
    get("/articulos/codificacion/grupos").then((r) => r.json()).then(setGrupos);
  }, [open, get]);

  useEffect(() => {
    setFamilia(""); setCodigo("");
    if (!grupo) { setFamilias([]); return; }
    get(`/articulos/codificacion/grupos/${grupo}/familias`)
      .then((r) => r.json())
      .then(setFamilias);
  }, [grupo, get]);

  useEffect(() => {
    if (!grupo || !familia) { setCodigo(""); return; }
    get(`/articulos/codificacion/next-codigo?grupo=${grupo}&familia=${familia}`)
      .then((r) => r.json())
      .then((d: { codigo: string }) => setCodigo(d.codigo))
      .catch(() => setCodigo(""));
  }, [grupo, familia, get]);

  const canSave = !!grupo && !!familia && !!nombre.trim() && Number(precioUnitario) > 0;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const body: CreateProveedorItemRequest = {
        codigo: codigo || null,
        nombre: nombre.trim(),
        unidadMedida: unidadMedida.trim() || null,
        precioUnitario: Number(precioUnitario),
      };
      const saved: ProveedorItemResponse = await post(
        `/proveedores/${proveedorId}/items`,
        body,
      ).then((r) => r.json());
      toast("Artículo creado", { description: `${saved.codigo ?? ""} ${saved.nombre}`.trim() });
      onCreated(saved);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear el artículo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo artículo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Grupo *</label>
              <Combobox
                options={grupos.map((g) => ({ value: g.codigo, label: `${g.codigo} · ${g.nombre}` }))}
                value={grupo}
                onChange={setGrupo}
                placeholder="Grupo..."
                className="w-full"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Familia *</label>
              <Combobox
                options={familias.map((f) => ({ value: f.codigo, label: `${f.codigo} · ${f.nombre}` }))}
                value={familia}
                onChange={setFamilia}
                placeholder="Familia..."
                disabled={!grupo}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Código</label>
            <Input value={codigo} readOnly placeholder="Se genera al elegir grupo y familia" className="bg-gray-50 font-mono" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nombre / descripción *</label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Leche entera La Serenisima" autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Unidad de medida</label>
              <Input value={unidadMedida} onChange={(e) => setUnidadMedida(e.target.value)} placeholder="Ej: Litro, Kg, Unidad" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Precio unitario *</label>
              <Input type="number" min="0" value={precioUnitario} onChange={(e) => setPrecioUnitario(e.target.value)} placeholder="0" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!canSave || saving}>
              {saving ? <><Spinner className="mr-2 h-4 w-4" />Guardando...</> : "Crear artículo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
