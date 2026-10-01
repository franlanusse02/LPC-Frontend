import { useState } from "react";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { useApi } from "@/hooks/useApi";
import type { PlantillaOrdenDeCompraResponse } from "@/domain/dto/orden-compra/PlantillaOrdenDeCompraResponse";
import { ConfirmDialog } from "./ConfirmDialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Fetched by the page each time it opens the panel.
  plantillas: PlantillaOrdenDeCompraResponse[];
  loading: boolean;
  onDeleted: (id: number) => void;
  onSelect: (plantilla: PlantillaOrdenDeCompraResponse) => void;
  onEdit: (plantilla: PlantillaOrdenDeCompraResponse) => void;
  onNueva: () => void;
}

export function PlantillasSheet({ open, onOpenChange, plantillas, loading, onDeleted, onSelect, onEdit, onNueva }: Props) {
  const { del } = useApi();
  const [toDelete, setToDelete] = useState<PlantillaOrdenDeCompraResponse | null>(null);

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await del(`/ordenes-de-compra/plantillas/${toDelete.id}`);
      onDeleted(toDelete.id);
      toast("Plantilla eliminada", { description: toDelete.nombre });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar la plantilla");
      throw err;
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="text-lg font-bold">Mis plantillas</SheetTitle>
            <SheetDescription>Elegí una para precargar la orden.</SheetDescription>
          </SheetHeader>

          <div className="px-4">
            <Button className="w-full gap-1.5" onClick={onNueva}>
              <Plus className="h-4 w-4" /> Nueva plantilla
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
            {loading ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : plantillas.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-gray-400">
                <FileText className="h-8 w-8" />
                <p className="text-sm">Todavía no tenés plantillas.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {plantillas.map((p) => (
                  <li key={p.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelect(p)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(p); } }}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-900">{p.nombre}</p>
                        <p className="truncate text-xs text-gray-500">
                          {p.proveedorNombre} · {p.items.length} {p.items.length === 1 ? "ítem" : "ítems"}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        title="Editar"
                        aria-label={`Editar ${p.nombre}`}
                        onClick={(e) => { e.stopPropagation(); onEdit(p); }}
                        onKeyDown={(e) => e.stopPropagation()}
                        className="text-gray-400 hover:text-gray-700"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        title="Eliminar"
                        aria-label={`Eliminar ${p.nombre}`}
                        onClick={(e) => { e.stopPropagation(); setToDelete(p); }}
                        onKeyDown={(e) => e.stopPropagation()}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Eliminar plantilla"
        description={<>Estás por eliminar la plantilla <strong className="text-gray-700">{toDelete?.nombre}</strong>. Esta acción no podrá revertirse.</>}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
      />
    </>
  );
}
