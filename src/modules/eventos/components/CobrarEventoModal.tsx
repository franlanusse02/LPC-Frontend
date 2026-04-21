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
import { CircleDollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediosPagoDict, type MedioPago } from "@/domain/enums/MedioPago";
import type { EventoResponse } from "@/domain/dto/evento/EventoResponse";

export type CobrarEventoPayload = {
  fechaPago: string;
  medioPago: MedioPago;
};

interface Props {
  open: boolean;
  onClose: () => void;
  evento: EventoResponse | null;
  onConfirm: (eventoId: number, payload: CobrarEventoPayload) => Promise<void>;
}

export function CobrarEventoModal({ open, onClose, evento, onConfirm }: Props) {
  const [loading, setLoading] = useState(false);
  const [fechaPago, setFechaPago] = useState("");
  const [medioPago, setMedioPago] = useState<string>("");

  const handleConfirm = async () => {
    if (!evento || !fechaPago || !medioPago) return;
    setLoading(true);
    try {
      await onConfirm(evento.id, { fechaPago, medioPago: medioPago as MedioPago });
      onClose();
      setFechaPago("");
      setMedioPago("");
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
              <DialogTitle className="text-lg font-bold text-gray-900">Registrar cobro</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-gray-500 leading-relaxed">
              Registrando cobro del evento del{" "}
              <strong className="text-gray-700">{evento?.fechaEvento}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Fecha de pago *
            </Label>
            <Input
              type="date"
              value={fechaPago}
              onChange={(e) => setFechaPago(e.target.value)}
              className="bg-card"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Medio de pago *
            </Label>
            <Select value={medioPago} onValueChange={setMedioPago}>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder="Seleccionar medio de pago..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MediosPagoDict).map(([label, value]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              disabled={loading || !fechaPago || !medioPago}
              className="rounded-lg font-semibold bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {loading ? <><Spinner className="mr-2 h-4 w-4" /> Registrando...</> : "Confirmar cobro"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
