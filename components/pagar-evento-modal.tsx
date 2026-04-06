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
import { CircleDollarSign } from "lucide-react";
import { FormField } from "./form-field";
import { DatePickerInput } from "./date-picker-input";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EventoResponse } from "@/models/dto/evento/EventoResponse";
import { MedioPago, MediosPagoDict } from "@/models/enums/MedioPago";

export interface PagarEventoPayload {
  fechaPago: string | null;
  medioPago: MedioPago | null;
  numeroOperacion: string | null;
}

interface PagarEventoModalProps {
  open: boolean;
  onClose: () => void;
  evento: EventoResponse;
  onConfirm: (eventoId: number, payload: PagarEventoPayload) => Promise<void>;
}

export function PagarEventoModal({
  open,
  onClose,
  evento,
  onConfirm,
}: PagarEventoModalProps) {
  const [loading, setLoading] = useState(false);
  const [fechaPago, setFechaPago] = useState("");
  const [medioPago, setMedioPago] = useState<MedioPago | "">("");
  const [numeroOperacion, setNumeroOperacion] = useState("");

  useEffect(() => {
    if (!open) return;
    setFechaPago(evento.fechaPago ?? "");
    setMedioPago(evento.medioPago ?? "");
    setNumeroOperacion(evento.numeroOperacion ?? "");
  }, [open, evento]);

  const handleConfirm = async () => {
    if (!fechaPago) return;
    setLoading(true);
    try {
      await onConfirm(evento.id, {
        fechaPago: fechaPago || null,
        medioPago: medioPago || null,
        numeroOperacion: numeroOperacion.trim() || null,
      });
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
                <CircleDollarSign className="h-5 w-5" />
              </span>
              <DialogTitle className="text-lg font-bold text-gray-900">
                Marcar pagado
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-gray-500 leading-relaxed">
              Registrá el cobro del evento del <strong className="text-gray-700">{evento.fechaEvento}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Fecha de pago *">
              <DatePickerInput value={fechaPago} onChange={setFechaPago} className="bg-card" />
            </FormField>

            <FormField label="Medio de pago">
              <Select
                value={medioPago}
                onValueChange={(value) => setMedioPago(value === "__none__" ? "" : value as MedioPago)}
              >
                <SelectTrigger className="bg-card">
                  <SelectValue placeholder="Sin especificar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin especificar</SelectItem>
                  {Object.entries(MediosPagoDict).map(([label, value]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Número de operación" className="col-span-2">
              <Input
                value={numeroOperacion}
                onChange={(event) => setNumeroOperacion(event.target.value)}
                placeholder="Ej: OP-123456"
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
              disabled={loading || !fechaPago}
              className="rounded-lg font-semibold bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {loading ? <><Spinner className="mr-2 h-4 w-4" />Guardando...</> : "Confirmar pago"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
