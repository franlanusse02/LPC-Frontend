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
import { Pencil, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { FormField } from "@/components/form-field";
import { Combobox } from "@/components/ui/combobox";
import { PaymentLineRow, type PaymentLine } from "@/components/payment-line-row";
import { AnularMovimientoModal } from "@/components/anular-movimiento-modal";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { ApiError } from "@/models/dto/ApiError";
import { ComedorResponse } from "@/models/dto/comedor/ComedorResponse";
import { PuntoDeVentaResponse } from "@/models/dto/pto-venta/PuntoDeVentaResponse";
import { CierreCajaResponse, DetailedCierreCajaResponse } from "@/models/dto/cierre-caja/CierreCajaResponse";
import { MovimientoResponse } from "@/models/dto/movimiento/MovimientoResponse";
import { MediosPagoDict } from "@/models/enums/MedioPago";

interface EditarCierreModalProps {
  open: boolean;
  onClose: () => void;
  cierre: DetailedCierreCajaResponse;
  comedores: ComedorResponse[];
  puntosDeVenta: PuntoDeVentaResponse[];
  onSuccess: () => void;
}

export function EditarCierreModal({
  open,
  onClose,
  cierre,
  comedores,
  puntosDeVenta,
  onSuccess,
}: EditarCierreModalProps) {
  const router = useRouter();
  const { session, logout } = useAuth();
  const { toast } = useToast();

  const initialComedorId = cierre.comedor
    ? String(cierre.comedor.id)
    : cierre.puntoDeVenta
      ? String(cierre.puntoDeVenta.comedorId)
      : "";

  const [fechaOperacion, setFechaOperacion] = useState(cierre.fechaOperacion ?? "");
  const [comedor, setComedor] = useState(initialComedorId);
  const [puntoVenta, setPuntoVenta] = useState(cierre.puntoDeVenta ? String(cierre.puntoDeVenta.id) : "");
  const [platosVendidos, setPlatosVendidos] = useState(String(cierre.totalPlatosVendidos ?? ""));
  const [comentario, setComentario] = useState(cierre.comentarios ?? "");

  const [lines, setLines] = useState<PaymentLine[]>(
    (cierre.movimientos ?? []).map((m) => ({
      id: m.id,
      medioPago: m.medioPago,
      monto: String(m.monto),
      anulacionId: m.anulacionId,
    })),
  );
  const [selectedLines, setSelectedLines] = useState<string[]>(
    (cierre.movimientos ?? []).filter((m) => m.anulacionId === null).map((m) => m.medioPago),
  );
  const [showAnuladas, setShowAnuladas] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingAnulaciones, setPendingAnulaciones] = useState<{ id: number; motivo: string }[]>([]);
  const [anularModalOpen, setAnularModalOpen] = useState(false);
  const [anularTargetIndex, setAnularTargetIndex] = useState<number | null>(null);

  if (!session) return null;
  const { token } = session;

  const filteredPuntosDeVenta = puntosDeVenta.filter(
    (p) => !comedor || String(p.comedorId) === comedor,
  );

  const comedorOptions = comedores.map((c) => ({ value: String(c.id), label: c.nombre }));
  const puntoVentaOptions = filteredPuntosDeVenta.map((p) => ({ value: String(p.id), label: p.nombre }));

  const activeLines = lines.filter((l) => l.anulacionId === null);
  const anuladasLines = lines.filter((l) => l.anulacionId !== null);
  const montoTotal = activeLines.reduce((sum, l) => sum + (Number(l.monto) || 0), 0);

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

  const handleAnularClick = (index: number) => {
    setAnularTargetIndex(index);
    setAnularModalOpen(true);
  };

  const handleAnularConfirm = async (_cierreId: number, motivo: string) => {
    if (anularTargetIndex === null) return;
    const line = lines[anularTargetIndex];
    if (line.id === null) return;
    setPendingAnulaciones((prev) => [...prev, { id: line.id!, motivo }]);
    setLines((prev) => prev.map((l, i) => i === anularTargetIndex ? { ...l, anulacionId: -1 } : l));
    setSelectedLines((prev) => prev.filter((v) => v !== line.medioPago));
  };

  const handleGuardar = async () => {
    const puntoVentaId = Number(puntoVenta);
    const totalPlatosVendidos = Number(platosVendidos);

    if (!puntoVenta || !platosVendidos) {
      toast({ variant: "destructive", title: "Campos requeridos", description: "Completa el punto de venta y la cantidad de platos vendidos." });
      return;
    }

    const newLines = lines.filter((l) => l.id === null && l.anulacionId === null);
    const validNewLines = newLines.filter((line) => line.medioPago && line.monto && Number(line.monto) > 0);

    if (validNewLines.length !== newLines.length) {
      toast({ variant: "destructive", title: "Campos inválidos", description: "Completa correctamente todos los campos de las nuevas líneas de pago." });
      return;
    }

    setLoading(true);
    try {
      if (pendingAnulaciones.length > 0) {
        await Promise.all(
          pendingAnulaciones.map(({ id, motivo }) =>
            apiFetch(`/api/movimiento/${id}/anular`, { method: "POST", body: JSON.stringify({ motivo }) }, token),
          ),
        );
      }

      await apiFetch<CierreCajaResponse>(
        `/api/cierre/${cierre.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ puntoDeVentaId: puntoVentaId, fechaOperacion, totalPlatosVendidos, comedorId: Number(comedor), comentarios: comentario }),
        },
        token,
      );

      if (validNewLines.length > 0) {
        await Promise.all(
          validNewLines.map((line) =>
            apiFetch<MovimientoResponse>(
              "/api/movimiento",
              { method: "POST", body: JSON.stringify({ cierreCajaId: cierre.id, medioPago: line.medioPago, monto: Number(line.monto) }) },
              token,
            ),
          ),
        );
      }

      toast({ title: "Cierre actualizado", description: "Los cambios se guardaron correctamente." });
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
        description: err instanceof ApiError ? err.message : err instanceof Error ? err.message : "No se pudo actualizar el cierre",
      });
    } finally {
      setLoading(false);
    }
  };

  const allMedios = Object.values(MediosPagoDict);
  const isAddLineDisabled = allMedios.length === activeLines.length;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="sm:max-w-4xl shadow-xl border-0 p-0 overflow-hidden">
          <div className="h-1.5 w-full bg-amber-400" />
          <div className="px-6 pt-5 pb-6 space-y-6">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                  <Pencil className="h-5 w-5" />
                </span>
                <DialogTitle className="text-lg font-bold text-gray-900">
                  Editar Cierre #{cierre.id}
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
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Líneas de Pago
                  </h3>
                  <span className="text-sm font-semibold text-muted-foreground">
                    Total: <span className="text-foreground">${montoTotal.toFixed(2)}</span>
                  </span>
                </div>

                <div className="space-y-4">
                  {activeLines.map((line) => {
                    const globalIndex = lines.indexOf(line);
                    return (
                      <PaymentLineRow
                        key={globalIndex}
                        line={line}
                        index={globalIndex}
                        onUpdate={updateLine}
                        onRemove={removeLine}
                        onAnular={handleAnularClick}
                        selectedLines={selectedLines}
                        setSelectedLines={setSelectedLines}
                      />
                    );
                  })}

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

                  {anuladasLines.length > 0 && (
                    <div className="pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAnuladas((v) => !v)}
                        className="mx-auto flex gap-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {showAnuladas ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {showAnuladas ? "Ocultar" : "Mostrar"} anuladas ({anuladasLines.length})
                      </Button>
                      {showAnuladas && (
                        <div className="mt-3 space-y-3 rounded-md border border-dashed border-muted p-3">
                          {anuladasLines.map((line) => {
                            const globalIndex = lines.indexOf(line);
                            return (
                              <PaymentLineRow
                                key={globalIndex}
                                line={line}
                                index={globalIndex}
                                onUpdate={updateLine}
                                onRemove={removeLine}
                                onAnular={handleAnularClick}
                                selectedLines={selectedLines}
                                setSelectedLines={setSelectedLines}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="rounded-lg border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleGuardar}
                disabled={loading || !puntoVenta || !platosVendidos}
                className="rounded-lg font-semibold bg-amber-400 hover:bg-amber-500 text-white"
              >
                {loading ? <><Spinner className="mr-2 h-4 w-4" />Guardando...</> : "Guardar Cambios"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {anularTargetIndex !== null && (
        <AnularMovimientoModal
          open={anularModalOpen}
          onClose={() => { setAnularModalOpen(false); setAnularTargetIndex(null); }}
          movimientoId={cierre.id}
          puntoVenta={cierre.puntoDeVenta?.nombre ?? ""}
          monto={Number(lines[anularTargetIndex].monto)}
          metodoPago={lines[anularTargetIndex].medioPago}
          onConfirm={handleAnularConfirm}
        />
      )}
    </>
  );
}
