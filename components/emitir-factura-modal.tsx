"use client";

import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Send } from "lucide-react";
import { FormField } from "./form-field";
import { DatePickerInput } from "./date-picker-input";
import { Input } from "@/components/ui/input";

export interface EmitirFacturaPayload {
  fechaEmision: string;
  fechaPago: string | null;
  numeroOperacion: string | null;
}

interface EmitirFacturaModalProps {
  open: boolean;
  onClose: () => void;
  facturaId: number;
  numeroFactura: string;
  currentNumeroOperacion: string | null;
  onConfirm: (facturaId: number, payload: EmitirFacturaPayload) => Promise<void>;
}

export function EmitirFacturaModal({
  open, onClose, facturaId, numeroFactura, currentNumeroOperacion, onConfirm,
}: EmitirFacturaModalProps) {
  const [loading, setLoading] = useState(false);
  const [fechaEmision, setFechaEmision] = useState("");
  const [fechaPago, setFechaPago] = useState("");
  const [numeroOperacion, setNumeroOperacion] = useState("");

  useEffect(() => {
    if (!open) return;
    setFechaEmision(new Date().toISOString().split("T")[0]);
    setFechaPago("");
    setNumeroOperacion(currentNumeroOperacion ?? "");
  }, [open, currentNumeroOperacion]);

  const handleConfirm = async () => {
    if (!fechaEmision) return;
    setLoading(true);
    try {
      await onConfirm(facturaId, {
        fechaEmision,
        fechaPago: fechaPago || null,
        numeroOperacion: numeroOperacion.trim() || null,
      });
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
                <Send className="h-5 w-5" />
              </span>
              <DialogTitle className="text-lg font-bold text-gray-900">
                Emitir factura
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-gray-500 leading-relaxed">
              Emitiendo factura <strong className="text-gray-700">#{numeroFactura}</strong>.
            </DialogDescription>
          </DialogHeader>
          <FormField label="Fecha de emisión *">
            <DatePickerInput value={fechaEmision}
              onChange={setFechaEmision} className="bg-card" />
          </FormField>
          <FormField label="Fecha de pago (opcional)">
            <DatePickerInput value={fechaPago}
              onChange={setFechaPago} className="bg-card" />
          </FormField>
          <FormField label="Número de operación">
            <Input
              value={numeroOperacion}
              onChange={(event) => setNumeroOperacion(event.target.value)}
              placeholder="Ej: OP-123456"
              className="bg-card"
            />
          </FormField>
          <DialogFooter className="flex-row justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={loading}
              className="rounded-lg border-gray-200 text-gray-600 hover:bg-gray-50">
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={loading || !fechaEmision}
              className="rounded-lg font-semibold bg-blue-500 hover:bg-blue-600 text-white">
              {loading ? <><Spinner className="mr-2 h-4 w-4" />Emitiendo...</> : "Emitir"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
