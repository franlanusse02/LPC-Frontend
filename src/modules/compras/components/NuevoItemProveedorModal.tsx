import { useEffect, useState } from "react";
import { Search } from "lucide-react";
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
import type { CatalogoArticuloResponse } from "@/domain/dto/proveedor/CatalogoArticuloResponse";

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
  // codigo reused from an existing article → don't regenerate from grupo/familia.
  const [codigoLocked, setCodigoLocked] = useState(false);
  const [nombre, setNombre] = useState("");
  const [unidadMedida, setUnidadMedida] = useState("");
  const [precioUnitario, setPrecioUnitario] = useState("");
  const [saving, setSaving] = useState(false);

  // Cross-proveedor article search.
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<CatalogoArticuloResponse[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!open) return;
    setGrupo(""); setFamilia(""); setCodigo(""); setCodigoLocked(false);
    setNombre(""); setUnidadMedida(""); setPrecioUnitario("");
    setSearchTerm(""); setResults([]); setShowResults(false);
    get("/articulos/codificacion/grupos").then((r) => r.json()).then(setGrupos);
  }, [open, get]);

  useEffect(() => {
    if (!grupo) { setFamilias([]); return; }
    get(`/articulos/codificacion/grupos/${grupo}/familias`)
      .then((r) => r.json())
      .then(setFamilias);
  }, [grupo, get]);

  // Debounced existing-article search.
  useEffect(() => {
    const q = searchTerm.trim();
    if (q.length < 2) { setResults([]); return; }
    let ignore = false;
    setSearching(true);
    const t = setTimeout(() => {
      get(`/articulos/codificacion/buscar?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d: CatalogoArticuloResponse[]) => { if (!ignore) setResults(Array.isArray(d) ? d : []); })
        .catch(() => { if (!ignore) setResults([]); })
        .finally(() => { if (!ignore) setSearching(false); });
    }, 250);
    return () => { ignore = true; clearTimeout(t); };
  }, [searchTerm, get]);

  const handleGrupoChange = (value: string) => {
    setGrupo(value);
    setFamilia("");
    setCodigo("");
    setCodigoLocked(false);
  };

  const handleFamiliaChange = (value: string) => {
    setFamilia(value);
    setCodigoLocked(false);
    if (!grupo || !value) { setCodigo(""); return; }
    get(`/articulos/codificacion/next-codigo?grupo=${grupo}&familia=${value}`)
      .then((r) => r.json())
      .then((d: { codigo: string }) => setCodigo(d.codigo))
      .catch(() => setCodigo(""));
  };

  // Reuse an existing article: same codigo + nombre, derive grupo/familia for display.
  const handlePickExisting = (art: CatalogoArticuloResponse) => {
    const m = art.codigo.match(/^(\d{2})\.(\d{2})\.\d{3}$/);
    if (m) { setGrupo(m[1]); setFamilia(m[2]); }
    setCodigo(art.codigo);
    setCodigoLocked(true);
    setNombre(art.nombre);
    setSearchTerm("");
    setResults([]);
    setShowResults(false);
  };

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
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto overscroll-contain">
        <DialogHeader>
          <DialogTitle>Nuevo artículo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Buscar artículo existente</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 120)}
                placeholder="Código o nombre en otros proveedores..."
                className="pl-8"
              />
              {showResults && searchTerm.trim().length >= 2 && (
                <div className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-white shadow-lg">
                  {searching ? (
                    <div className="px-3 py-2 text-sm text-gray-400">Buscando...</div>
                  ) : results.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-400">Sin resultados</div>
                  ) : (
                    results.map((art) => (
                      <button
                        key={art.codigo}
                        type="button"
                        onClick={() => handlePickExisting(art)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                      >
                        <span className="font-mono text-gray-500">{art.codigo}</span>
                        <span className="truncate">{art.nombre}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400">
              Reutiliza el código si el artículo ya existe en otro proveedor.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Grupo *</label>
              <Combobox
                options={grupos.map((g) => ({ value: g.codigo, label: `${g.codigo} · ${g.nombre}` }))}
                value={grupo}
                onChange={handleGrupoChange}
                placeholder="Grupo..."
                className="w-full"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Familia *</label>
              <Combobox
                options={familias.map((f) => ({ value: f.codigo, label: `${f.codigo} · ${f.nombre}` }))}
                value={familia}
                onChange={handleFamiliaChange}
                placeholder="Familia..."
                disabled={!grupo}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Código</label>
            <Input value={codigo} readOnly placeholder="Se genera al elegir grupo y familia" className="bg-gray-50 font-mono" />
            {codigoLocked && (
              <p className="text-xs text-emerald-600">Código reutilizado de un artículo existente.</p>
            )}
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
