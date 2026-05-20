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
import { CheckCircle2 } from "lucide-react";
import type { EventoResponse } from "@/domain/dto/evento/EventoResponse";

interface Props {
  open: boolean;
  onClose: () => void;
  evento: EventoResponse | null;
  onConfirm: (eventoId: number) => Promise<void>;
}

export function RealizarEventoModal({ open, onClose, evento, onConfirm }: Props) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!evento) return;
    setLoading(true);
    try {
      await onConfirm(evento.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md shadow-xl border-0 p-0 overflow-hidden">
        <div className="h-1.5 w-full bg-blue-500" />
        <div className="px-6 pt-5 pb-6 space-y-5">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <DialogTitle className="text-lg font-bold text-gray-900">Marcar como realizado</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-gray-500 leading-relaxed">
              Confirmá que el evento del{" "}
              <strong className="text-gray-700">{evento?.fechaEvento}</strong> fue realizado.
            </DialogDescription>
          </DialogHeader>
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
              disabled={loading}
              className="rounded-lg font-semibold bg-blue-500 hover:bg-blue-600 text-white"
            >
              {loading ? <><Spinner className="mr-2 h-4 w-4" /> Confirmando...</> : "Confirmar"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
