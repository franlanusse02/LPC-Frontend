"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CircleCheckBig } from "lucide-react";

interface RealizarEventoModalProps {
  open: boolean;
  onClose: () => void;
  eventoId: number;
  fechaEvento: string;
  comedorNombre: string;
  onConfirm: (eventoId: number) => Promise<void>;
}

export function RealizarEventoModal({
  open,
  onClose,
  eventoId,
  fechaEvento,
  comedorNombre,
  onConfirm,
}: RealizarEventoModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(eventoId);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="sm:max-w-md shadow-xl border-0 p-0 overflow-hidden">
        <div className="h-1.5 w-full bg-emerald-500" />
        <div className="px-6 pt-5 pb-6 space-y-5">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CircleCheckBig className="h-5 w-5" />
              </span>
              <DialogTitle className="text-lg font-bold text-gray-900">
                Marcar realizado
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-gray-500 leading-relaxed">
              Vas a marcar como realizado el evento del{" "}
              <strong className="text-gray-700">{fechaEvento}</strong> en{" "}
              <strong className="text-gray-700">{comedorNombre}</strong>.
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
              className="rounded-lg font-semibold bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {loading ? <><Spinner className="mr-2 h-4 w-4" />Guardando...</> : "Confirmar"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
