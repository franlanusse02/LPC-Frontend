"use client";

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
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface AnularModalProps {
  open: boolean;
  onClose: () => void;
  isAnulado: boolean;
  cierreId: number;
  fechaOperacion: string;
  onConfirm: (cierreId: number, motivo: string) => Promise<void>;
}

export function AnularModal({
  open,
  onClose,
  isAnulado,
  cierreId,
  fechaOperacion,
  onConfirm,
}: AnularModalProps) {
  const [loading, setLoading] = useState(false);
  const [motivo, setMotivo] = useState("");

  const handleConfirm = async () => {
    if (!isAnulado && !motivo.trim()) return;
    setLoading(true);
    try {
      await onConfirm(cierreId, motivo);
      onClose();
    } finally {
      setLoading(false);
      setMotivo("");
    }
  };

  const action = isAnulado ? "Desanular" : "Anular";
  const isDestructive = !isAnulado;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl shadow-xl border-0 p-0 overflow-hidden">
        <div
          className={`h-1.5 w-full ${isDestructive ? "bg-red-500" : "bg-emerald-500"}`}
        />

        <div className="px-6 pt-5 pb-6 space-y-5">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  isDestructive
                    ? "bg-red-50 text-red-500"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                {isDestructive ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <RotateCcw className="h-5 w-5" />
                )}
              </span>
              <DialogTitle className="text-lg font-bold text-gray-900">
                {action} cierre
              </DialogTitle>
            </div>

            <DialogDescription className="text-sm text-gray-500 leading-relaxed">
              {isDestructive ? (
                <>
                  Estás por <strong className="text-gray-700">anular</strong> el
                  cierre del{" "}
                  <strong className="text-gray-700">{fechaOperacion}</strong>.
                  Esta acción podrá revertirse posteriormente.
                </>
              ) : (
                <>
                  Estás por <strong className="text-gray-700">reactivar</strong>{" "}
                  el cierre del{" "}
                  <strong className="text-gray-700">{fechaOperacion}</strong>.
                  Volverá a estar activo en el sistema.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {isDestructive && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Motivo de anulación <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ingresá el motivo..."
                className="resize-none rounded-lg border-gray-200"
                rows={3}
              />
            </div>
          )}

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
              disabled={loading || (isDestructive && !motivo.trim())}
              className={`rounded-lg font-semibold ${
                isDestructive
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-emerald-500 hover:bg-emerald-600 text-white"
              }`}
            >
              {loading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  {isDestructive ? "Anulando..." : "Desanulando..."}
                </>
              ) : (
                action
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}