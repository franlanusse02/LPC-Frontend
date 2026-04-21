
"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CircleDollarSign } from "lucide-react";
import { FormField } from "./form-field";
import { DatePickerInput } from "./date-picker-input";

interface PagarFacturaModalProps {
  open: boolean;
  onClose: () => void;
  facturaId: number;
  numeroFactura: string;
  currentFechaPago: string | null;
  onConfirm: (facturaId: number, fechaPago: string | null) => Promise<void>;
}

export function PagarFacturaModal({
  open, onClose, facturaId, numeroFactura, currentFechaPago, onConfirm,
}: PagarFacturaModalProps) {
  const [loading, setLoading] = useState(false);
  const [fechaPago, setFechaPago] = useState(currentFechaPago ?? "");

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(facturaId, fechaPago || null);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md shadow-xl border-0 p-0 overflow-hidden">
        <div className="h-1.5 w-full bg-emerald-500" />
        <div className="px-6 pt-5 pb-6 space-y-5">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CircleDollarSign className="h-5 w-5" />
              </span>
              <DialogTitle className="text-lg font-bold text-gray-900">
                Registrar pago
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-gray-500 leading-relaxed">
              Registrando pago de factura{" "}
              <strong className="text-gray-700">#{numeroFactura}</strong>.
            </DialogDescription>
          </DialogHeader>
          <FormField label={currentFechaPago ? "Fecha de pago (pre-cargada)" : "Fecha de pago *"}>
            <DatePickerInput value={fechaPago}
              onChange={setFechaPago} className="bg-card" />
          </FormField>
          <DialogFooter className="flex-row justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={loading}
              className="rounded-lg border-gray-200 text-gray-600 hover:bg-gray-50">
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={loading || !fechaPago}
              className="rounded-lg font-semibold bg-emerald-500 hover:bg-emerald-600 text-white">
              {loading ? <><Spinner className="mr-2 h-4 w-4" />Registrando...</> : "Confirmar pago"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
