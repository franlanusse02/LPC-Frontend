"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Plus } from "lucide-react";
import { FormField } from "@/components/form-field";
import { Combobox } from "@/components/ui/combobox";
import { PaymentLineRow, type PaymentLine } from "@/components/payment-line-row";
import { apiFetch } from "@/lib/api";
import { getTodayDate } from "@/lib/dateParser";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { ApiError } from "@/models/dto/ApiError";
import { ComedorResponse } from "@/models/dto/comedor/ComedorResponse";
import { PuntoDeVentaResponse } from "@/models/dto/pto-venta/PuntoDeVentaResponse";
import { CierreCajaResponse } from "@/models/dto/cierre-caja/CierreCajaResponse";
import { MovimientoResponse } from "@/models/dto/movimiento/MovimientoResponse";
import { MediosPagoDict } from "@/models/enums/MedioPago";

interface NuevoCierreModalProps {
  open: boolean;
  onClose: () => void;
  comedores: ComedorResponse[];
  puntosDeVenta: PuntoDeVentaResponse[];
  onSuccess: () => void;
}

export function NuevoCierreModal({
  open,
  onClose,
  comedores,
  puntosDeVenta,
  onSuccess,
}: NuevoCierreModalProps) {
  const router = useRouter();
  const { session, logout } = useAuth();
  const { toast } = useToast();

  const [fechaOperacion, setFechaOperacion] = useState(getTodayDate());
  const [comedor, setComedor] = useState("");
  const [puntoVenta, setPuntoVenta] = useState("");
  const [platosVendidos, setPlatosVendidos] = useState("");
  const [comentario, setComentario] = useState("");
  const [lines, setLines] = useState<PaymentLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLines, setSelectedLines] = useState<string[]>([]);

  if (!session) return null;
  const { token } = session;

  const filteredPuntosDeVenta = puntosDeVenta.filter(
    (p) => !comedor || String(p.comedorId) === comedor,
  );

  const comedorOptions = comedores.map((c) => ({ value: String(c.id), label: c.nombre }));
  const puntoVentaOptions = filteredPuntosDeVenta.map((p) => ({ value: String(p.id), label: p.nombre }));

  const addLine = () => {
    setLines((prev) => [...prev, { id: null, medioPago: "", monto: "", anulacionId: null }]);
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof PaymentLine, value: string) => {
    setLines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const resetForm = () => {
    setFechaOperacion(getTodayDate());
    setComedor("");
    setPuntoVenta("");
    setPlatosVendidos("");
    setComentario("");
    setLines([]);
    setSelectedLines([]);
  };

  const handleFinalizar = async () => {
    const puntoVentaId = Number(puntoVenta);
    const totalPlatosVendidos = Number(platosVendidos);

    if (!puntoVenta || !platosVendidos) {
      toast({
        variant: "destructive",
        title: "Campos requeridos",
        description: "Completa el punto de venta y la cantidad de platos vendidos.",
      });
      return;
    }

    const validLines = lines.filter(
      (line) => line.medioPago && line.monto && Number(line.monto) > 0,
    );

    if (validLines.length !== lines.length) {
      toast({
        variant: "destructive",
        title: "Campos inválidos",
        description: "Completa correctamente todos los campos de las líneas de pago.",
      });
      return;
    }

    setLoading(true);
    try {
      const cierreResponse = await apiFetch<CierreCajaResponse>(
        "/api/cierre",
        {
          method: "POST",
          body: JSON.stringify({ puntoVentaId, fechaOperacion, totalPlatosVendidos, comentarios: comentario }),
        },
        token,
      );

      const movimientoPromises = validLines.map((line) =>
        apiFetch<MovimientoResponse>(
          "/api/movimiento",
          {
            method: "POST",
            body: JSON.stringify({ cierreCajaId: cierreResponse.id, medioPago: line.medioPago, monto: Number(line.monto) }),
          },
          token,
        ),
      );
      await Promise.all(movimientoPromises);

      toast({
        title: "Cierre finalizado",
        description: validLines.length > 0
          ? `Se creó el cierre con ${validLines.length} línea(s) de pago.`
          : "Se creó el cierre correctamente.",
      });
      resetForm();
      onClose();
      onSuccess();
    } catch (err) {
      if (ApiError.isUnauthorized(err)) {
        toast({ variant: "destructive", title: "Sesión expirada", description: "Tu sesión ha expirado." });
        logout();
        router.replace("/login");
        return;
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof ApiError ? err.message : err instanceof Error ? err.message : "No se pudo crear el cierre",
      });
    } finally {
      setLoading(false);
    }
  };

  const allMedios = Object.values(MediosPagoDict);
  const isAddLineDisabled = lines.length >= allMedios.length;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { resetForm(); onClose(); } }}>
      <DialogContent className="sm:max-w-4xl shadow-xl border-0 p-0 overflow-hidden">
        <div className="h-1.5 w-full bg-primary" />
        <div className="px-6 pt-5 pb-6 space-y-6">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Plus className="h-5 w-5" />
              </span>
              <DialogTitle className="text-lg font-bold text-gray-900">
                Nuevo Cierre
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Left column — main fields */}
            <div className="flex-1 space-y-5">
              <FormField label="Fecha Operación">
                <Input
                  type="date"
                  value={fechaOperacion}
                  onChange={(e) => setFechaOperacion(e.target.value)}
                  className="max-w-xs bg-card"
                  max={new Date().toISOString().split("T")[0]}
                />
              </FormField>

              <FormField label="Comedor">
                <Combobox
                  options={comedorOptions}
                  value={comedor}
                  onChange={(v) => { setComedor(v); setPuntoVenta(""); }}
                  placeholder="Seleccionar comedor..."
                  searchPlaceholder="Buscar comedor..."
                  className="max-w-xs"
                />
              </FormField>

              <FormField label="Punto de Venta">
                <Combobox
                  options={puntoVentaOptions}
                  value={puntoVenta}
                  onChange={setPuntoVenta}
                  placeholder="Seleccionar..."
                  searchPlaceholder="Buscar punto de venta..."
                  disabled={!comedor}
                  className="max-w-xs"
                />
              </FormField>

              <FormField label="Número de Platos Vendidos">
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={platosVendidos}
                  onChange={(e) => setPlatosVendidos(e.target.value)}
                  className="max-w-xs bg-card"
                  placeholder="0"
                />
              </FormField>

              <FormField label="Comentarios">
                <Input
                  type="text"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  className="max-w-xs bg-card"
                  placeholder="Comentario (opcional)"
                />
              </FormField>
            </div>

            {/* Right column — payment lines */}
            <div className="flex-1">
              <h3 className="mb-4 text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Líneas de Pago
              </h3>
              <div className="space-y-4">
                {lines.map((line, i) => (
                  <PaymentLineRow
                    key={i}
                    line={line}
                    index={i}
                    onUpdate={updateLine}
                    onRemove={removeLine}
                    onAnular={() => {}}
                    selectedLines={selectedLines}
                    setSelectedLines={setSelectedLines}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addLine}
                  disabled={isAddLineDisabled}
                  className="mx-auto flex gap-2 text-sm font-bold uppercase tracking-wide"
                >
                  <Plus className="h-4 w-4" />
                  Nueva Línea
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => { resetForm(); onClose(); }}
              disabled={loading}
              className="rounded-lg border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleFinalizar}
              disabled={loading || !puntoVenta || !platosVendidos}
              className="rounded-lg font-semibold"
            >
              {loading ? <><Spinner className="mr-2 h-4 w-4" />Guardando...</> : "Finalizar Cierre"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
