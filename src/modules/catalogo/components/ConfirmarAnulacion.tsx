import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useApi } from "@/hooks/useApi";

interface Producto {
  productoId: number;
  nombre: string;
  activo: boolean;
}

interface ConfirmarAnulacionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  producto: Producto | null;
  onSuccess?: () => void;
}

export function ConfirmarAnulacion({
  open,
  onOpenChange,
  producto,
  onSuccess,
}: ConfirmarAnulacionProps) {
  const { del } = useApi();
  const [anulando, setAnulando] = useState(false);

  const handleAnular = async () => {
    if (!producto) return;
    setAnulando(true);
    try {
      await del(`/consumos/productos/${producto.productoId}`);
      toast.success("Producto desactivado");
      onSuccess?.();
      onOpenChange(false);
    } catch {
      toast.error("Error al desactivar");
    } finally {
      setAnulando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md shadow-xl border-0 p-0 overflow-hidden">
        <div className="h-1.5 w-full bg-red-500" />
        <div className="px-6 pt-5 pb-6 space-y-5">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <DialogTitle className="text-lg font-bold text-gray-900">
                Desactivar producto
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-gray-500 leading-relaxed">
              Estás por <strong className="text-gray-700">desactivar</strong> el
              producto{" "}
              <strong className="text-gray-700">{producto?.nombre}</strong>. Esta
              acción no podrá revertirse.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={anulando}
              className="rounded-lg border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAnular}
              disabled={anulando}
              className="rounded-lg font-semibold bg-red-500 hover:bg-red-600 text-white"
            >
              {anulando ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Desactivando...
                </>
              ) : (
                "Desactivar"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
