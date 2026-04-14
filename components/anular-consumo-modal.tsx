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
import { AlertTriangle } from "lucide-react";
import { FormField } from "@/components/form-field";
import { Input } from "@/components/ui/input";

interface AnularConsumoModalProps {
  open: boolean;
  onClose: () => void;
  consumoId: number;
  fecha: string;
  consumidorNombre: string;
  onConfirm: (consumoId: number, motivo: string) => Promise<void>;
}

export function AnularConsumoModal({
  open,
  onClose,
  consumoId,
  fecha,
  consumidorNombre,
  onConfirm,
}: AnularConsumoModalProps) {
  const [loading, setLoading] = useState(false);
  const [motivo, setMotivo] = useState("");

  const handleConfirm = async () => {
    if (!motivo.trim()) return;

    setLoading(true);
    try {
      await onConfirm(consumoId, motivo.trim());
      setMotivo("");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="sm:max-w-md overflow-hidden border-0 p-0 shadow-xl">
        <div className="h-1.5 w-full bg-red-500" />
        <div className="space-y-5 px-6 pb-6 pt-5">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <DialogTitle className="text-lg font-bold text-gray-900">
                Anular consumo
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm leading-relaxed text-gray-500">
              Estás por <strong className="text-gray-700">anular</strong> el
              consumo del <strong className="text-gray-700">{fecha}</strong> de{" "}
              <strong className="text-gray-700">{consumidorNombre}</strong>.
              Esta acción no podrá revertirse.
            </DialogDescription>
          </DialogHeader>

          <FormField label="Motivo *">
            <Input
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              placeholder="Motivo de anulación"
              className="bg-card"
            />
          </FormField>

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
              className="rounded-lg bg-red-500 font-semibold text-white hover:bg-red-600"
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
