import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { FacturaProveedorResponse } from "@/domain/dto/compra/FacturaProveedorResponse";

interface AnularFacturaModalProps {
  open: boolean;
  onClose: () => void;
  factura: FacturaProveedorResponse | null;
  onConfirm: (facturaId: number, motivo: string) => Promise<void>;
}

export function AnularFacturaModal({
  open,
  onClose,
  factura,
  onConfirm,
}: AnularFacturaModalProps) {
  const [loading, setLoading] = useState(false);
  const [motivo, setMotivo] = useState("");

  const handleConfirm = async () => {
    if (!factura) return;
    setLoading(true);
    try {
      await onConfirm(factura.id, motivo);
      onClose();
      setMotivo("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md shadow-xl border-0 p-0 overflow-hidden">
        <div className="h-1.5 w-full bg-red-500" />

        <div className="px-6 pt-5 pb-6 space-y-5">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <DialogTitle className="text-lg font-bold text-gray-900">
                Anular factura
              </DialogTitle>
            </div>

            <DialogDescription className="text-sm text-gray-500 leading-relaxed">
              Est\u00e1s por{" "}
              <strong className="text-gray-700">anular</strong> la factura{" "}
              <strong className="text-gray-700">
                #{factura?.numero}
              </strong>
              . Esta acci\u00f3n no podr\u00e1 revertirse.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
              Motivo
            </label>
            <Input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="bg-card"
              placeholder="Motivo de anulaci\u00f3n"
            />
          </div>

          <DialogFooter className="flex-row justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading || !motivo.trim()}
              className="rounded-lg font-semibold bg-red-500 hover:bg-red-600 text-white"
            >
              {loading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Anulando...
                </>
              ) : (
                "Anular"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
