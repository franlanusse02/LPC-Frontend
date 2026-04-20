"use client";

import { useEffect, useState } from "react";
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
import { Send } from "lucide-react";
import { FormField } from "./form-field";
import { DatePickerInput } from "./date-picker-input";
import { Input } from "@/components/ui/input";
import { EventoResponse } from "@/models/dto/evento/EventoResponse";

export interface EmitirEventoPayload {
  fechaEmision: string;
  fechaPago: string | null;
  tipoComprobante: string | null;
  numeroComprobante: string | null;
}

interface EmitirEventoModalProps {
  open: boolean;
  onClose: () => void;
  evento: EventoResponse;
  onConfirm: (eventoId: number, payload: EmitirEventoPayload) => Promise<void>;
}

export function EmitirEventoModal({
  open,
  onClose,
  evento,
  onConfirm,
}: EmitirEventoModalProps) {
  const [loading, setLoading] = useState(false);
  const [fechaEmision, setFechaEmision] = useState("");
  const [fechaPago, setFechaPago] = useState("");
  const [tipoComprobante, setTipoComprobante] = useState("");
  const [numeroComprobante, setNumeroComprobante] = useState("");

  useEffect(() => {
    if (!open) return;
    setFechaEmision(evento.fechaEmision ?? new Date().toISOString().split("T")[0]);
    setFechaPago(evento.fechaPago ?? "");
    setTipoComprobante(evento.tipoComprobante ?? "");
    setNumeroComprobante(evento.numeroComprobante ?? "");
  }, [open, evento]);

  const handleConfirm = async () => {
    if (!fechaEmision) return;
    setLoading(true);
    try {
      await onConfirm(evento.id, {
        fechaEmision,
        fechaPago: fechaPago || null,
        tipoComprobante: tipoComprobante.trim() || null,
        numeroComprobante: numeroComprobante.trim() || null,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="sm:max-w-md shadow-xl border-0 p-0 overflow-hidden">
        <div className="h-1.5 w-full bg-blue-500" />
        <div className="px-6 pt-5 pb-6 space-y-5">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                <Send className="h-5 w-5" />
              </span>
              <DialogTitle className="text-lg font-bold text-gray-900">
                Emitir factura de evento
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-gray-500 leading-relaxed">
              Completá la emisión del evento del <strong className="text-gray-700">{evento.fechaEvento}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Fecha de emisión *">
              <DatePickerInput value={fechaEmision} onChange={setFechaEmision} className="bg-card" />
            </FormField>

            <FormField label="Fecha de pago">
              <DatePickerInput value={fechaPago} onChange={setFechaPago} className="bg-card" />
            </FormField>

            <FormField label="Tipo comprobante">
              <Input
                value={tipoComprobante}
                onChange={(event) => setTipoComprobante(event.target.value)}
                placeholder="Ej: Factura A"
                className="bg-card"
              />
            </FormField>

            <FormField label="Número comprobante">
              <Input
                value={numeroComprobante}
                onChange={(event) => setNumeroComprobante(event.target.value)}
                placeholder="Ej: 0001-00001234"
                className="bg-card"
              />
            </FormField>
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
              disabled={loading || !fechaEmision}
              className="rounded-lg font-semibold bg-blue-500 hover:bg-blue-600 text-white"
            >
              {loading ? <><Spinner className="mr-2 h-4 w-4" />Emitiendo...</> : "Emitir"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
