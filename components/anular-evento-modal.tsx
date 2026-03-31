"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AlertTriangle } from "lucide-react";
import { FormField } from "./form-field";
import { Input } from "./ui/input";

interface AnularEventoModalProps {
  open: boolean;
  onClose: () => void;
  eventoId: number;
  fechaEvento: string;
  comedorNombre: string;
  onConfirm: (eventoId: number, motivo: string) => Promise<void>;
}

export function AnularEventoModal({
  open, onClose, eventoId, fechaEvento, comedorNombre, onConfirm,
}: AnularEventoModalProps) {
  const [loading, setLoading] = useState(false);
  const [motivo, setMotivo] = useState("");

  const handleConfirm = async () => {
    if (!motivo.trim()) return;
    setLoading(true);
    try {
      await onConfirm(eventoId, motivo);
      onClose();
    } finally {
      setLoading(false);
      setMotivo("");
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
                Anular evento
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-gray-500 leading-relaxed">
              Estás por <strong className="text-gray-700">anular</strong> el evento
              del <strong className="text-gray-700">{fechaEvento}</strong> de{" "}
              <strong className="text-gray-700">{comedorNombre}</strong>.
              Esta acción no podrá revertirse.
            </DialogDescription>
          </DialogHeader>
          <FormField label="Motivo *">
            <Input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="bg-card"
              placeholder="Motivo de anulación"
            />
          </FormField>
          <DialogFooter className="flex-row justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={loading}
              className="rounded-lg border-gray-200 text-gray-600 hover:bg-gray-50">
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={loading || !motivo.trim()}
              className="rounded-lg font-semibold bg-red-500 hover:bg-red-600 text-white">
              {loading ? <><Spinner className="mr-2 h-4 w-4" />Anulando...</> : "Anular"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
