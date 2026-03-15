"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/form-field";
import {
  PaymentLineRow,
  type PaymentLine,
} from "@/components/payment-line-row";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { ApiError } from "@/models/dto/ApiError";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { ComedorResponse } from "@/models/dto/comedor/ComedorResponse";
import { PuntoDeVentaResponse } from "@/models/dto/pto-venta/PuntoDeVentaResponse";
import { MovimientoResponse } from "@/models/dto/movimiento/MovimientoResponse";
import {
  CierreCajaResponse,
  DetailedCierreCajaResponse,
} from "@/models/dto/cierre-caja/CierreCajaResponse";
import { MediosPagoDict } from "@/models/enums/MedioPago";
import { AnularMovimientoModal } from "@/components/anular-movimiento-modal";

interface EditCierreFormProps {
  comedores: ComedorResponse[];
  puntosDeVenta: PuntoDeVentaResponse[];
  cierre: DetailedCierreCajaResponse;
}

export function EditCierreForm({
  comedores,
  puntosDeVenta,
  cierre,
}: EditCierreFormProps) {
  const router = useRouter();
  const { session, logout } = useAuth();
  const { toast } = useToast();

  const initialComedorId = cierre.comedor
    ? String(cierre.comedor.id)
    : cierre.puntoDeVenta
      ? String(cierre.puntoDeVenta.comedorId)
      : "";

  const [fechaOperacion, setFechaOperacion] = useState(
    cierre.fechaOperacion ?? "",
  );
  const [comedor, setComedor] = useState(initialComedorId);
  const [puntoVenta, setPuntoVenta] = useState(
    cierre.puntoDeVenta ? String(cierre.puntoDeVenta.id) : "",
  );
  const [platosVendidos, setPlatosVendidos] = useState(
    String(cierre.totalPlatosVendidos ?? ""),
  );
  const [comentario, setComentario] = useState(cierre.comentarios ?? "");

  // All lines in a single list — distinguished by id and anulacionId
  const [lines, setLines] = useState<PaymentLine[]>(
    (cierre.movimientos ?? []).map((m) => ({
      id: m.id,
      medioPago: m.medioPago,
      monto: String(m.monto),
      anulacionId: m.anulacionId,
    })),
  );

  const [selectedLines, setSelectedLines] = useState<string[]>(
    (cierre.movimientos ?? [])
      .filter((m) => m.anulacionId === null)
      .map((m) => m.medioPago),
  );

  const [showAnuladas, setShowAnuladas] = useState(false);
  const [loading, setLoading] = useState(false);
  // { id: movimientoId, motivo } — queued until "Guardar Cambios" is pressed
  const [pendingAnulaciones, setPendingAnulaciones] = useState<
    { id: number; motivo: string }[]
  >([]);

  // Anular modal state
  const [anularModalOpen, setAnularModalOpen] = useState(false);
  const [anularTargetIndex, setAnularTargetIndex] = useState<number | null>(
    null,
  );

  if (!session) return null;
  const { token } = session;

  const filteredPuntosDeVenta = puntosDeVenta.filter(
    (punto) => !comedor || String(punto.comedorId) === comedor,
  );

  // Derived lists
  const activeLines = lines.filter((l) => l.anulacionId === null);
  const anuladasLines = lines.filter((l) => l.anulacionId !== null);

  // Total excludes anuladas
  const montoTotal = activeLines.reduce(
    (sum, l) => sum + (Number(l.monto) || 0),
    0,
  );

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { id: null, medioPago: "", monto: "", anulacionId: null },
    ]);
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLine = (
    index: number,
    field: keyof PaymentLine,
    value: string,
  ) => {
    setLines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Called from PaymentLineRow — opens the modal for the given line index
  const handleAnularClick = (index: number) => {
    setAnularTargetIndex(index);
    setAnularModalOpen(true);
  };

  // Called when the modal confirms — queues the anulation locally, no API call yet
  const handleAnularConfirm = async (_cierreId: number, motivo: string) => {
    if (anularTargetIndex === null) return;

    const line = lines[anularTargetIndex];
    if (line.id === null) return;

    // Queue for when the user clicks "Guardar Cambios"
    setPendingAnulaciones((prev) => [...prev, { id: line.id!, motivo }]);

    // Mark locally as anulado (-1 sentinel — row just needs anulacionId !== null)
    setLines((prev) =>
      prev.map((l, i) =>
        i === anularTargetIndex ? { ...l, anulacionId: -1 } : l,
      ),
    );

    // Free up the medioPago for new lines
    setSelectedLines((prev) => prev.filter((v) => v !== line.medioPago));
  };

  const handleGuardar = async () => {
    const puntoVentaId = Number(puntoVenta);
    const totalPlatosVendidos = Number(platosVendidos);

    if (!puntoVenta || !platosVendidos) {
      toast({
        variant: "destructive",
        title: "Campos requeridos",
        description:
          "Completa el punto de venta y la cantidad de platos vendidos.",
      });
      return;
    }

    const newLines = lines.filter(
      (l) => l.id === null && l.anulacionId === null,
    );

    const validNewLines = newLines.filter(
      (line) => line.medioPago && line.monto && Number(line.monto) > 0,
    );

    if (validNewLines.length !== newLines.length) {
      toast({
        variant: "destructive",
        title: "Campos inválidos",
        description:
          "Completa correctamente todos los campos de las nuevas líneas de pago.",
      });
      return;
    }

    setLoading(true);
    try {
      if (pendingAnulaciones.length > 0) {
        await Promise.all(
          pendingAnulaciones.map(({ id, motivo }) =>
            apiFetch(
              `/api/movimiento/${id}/anular`,
              { method: "POST", body: JSON.stringify({ motivo }) },
              token,
            ),
          ),
        );
      }

      // 2. PATCH cierre fields
      await apiFetch<CierreCajaResponse>(
        `/api/cierre/${cierre.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            puntoDeVentaId: puntoVentaId,
            fechaOperacion,
            totalPlatosVendidos,
            comedorId: Number(comedor),
            comentarios: comentario,
          }),
        },
        token,
      );

      // 3. POST only genuinely new lines
      if (validNewLines.length > 0) {
        const createPromises = validNewLines.map((line) =>
          apiFetch<MovimientoResponse>(
            "/api/movimiento",
            {
              method: "POST",
              body: JSON.stringify({
                cierreCajaId: cierre.id,
                medioPago: line.medioPago,
                monto: Number(line.monto),
              }),
            },
            token,
          ),
        );
        await Promise.all(createPromises);
      }

      toast({
        title: "Cierre actualizado",
        description: "Los cambios se guardaron correctamente.",
      });
      router.push("/contabilidad");
    } catch (err) {
      if (ApiError.isUnauthorized(err)) {
        toast({
          variant: "destructive",
          title: "Sesión expirada",
          description:
            "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
        });
        logout();
        router.replace("/login");
        return;
      }

      const errorMessage =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "No se pudo actualizar el cierre";

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const allMedios = Object.values(MediosPagoDict);
  const isAddLineDisabled = allMedios.length === selectedLines.length;

  return (
    <>
      <div className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="text-xl font-bold uppercase tracking-wide">
              Editar Cierre #{cierre.id}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
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
                  <Select
                    value={comedor}
                    onValueChange={(value) => {
                      setComedor(value);
                      setPuntoVenta("");
                    }}
                  >
                    <SelectTrigger className="max-w-xs bg-card">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {comedores.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.nombre}
                        </SelectItem>
                      ))}
                      {comedores.length === 0 && (
                        <SelectItem value="disabled" disabled>
                          No hay comedores disponibles
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Punto de Venta">
                  <Select
                    value={puntoVenta}
                    onValueChange={setPuntoVenta}
                    disabled={!comedor}
                  >
                    <SelectTrigger className="max-w-xs bg-card">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredPuntosDeVenta.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.nombre}
                        </SelectItem>
                      ))}
                      {filteredPuntosDeVenta.length === 0 && (
                        <SelectItem value="disabled" disabled>
                          No hay puntos de venta disponibles
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
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
                    Total:{" "}
                    <span className="text-foreground">
                      ${montoTotal.toFixed(2)}
                    </span>
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Active lines (persisted + new) */}
                  {activeLines.map((line, i) => {
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

                  {/* Show/Hide anuladas toggle */}
                  {anuladasLines.length > 0 && (
                    <div className="pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAnuladas((v) => !v)}
                        className="mx-auto flex gap-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {showAnuladas ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                        {showAnuladas ? "Ocultar" : "Mostrar"} anuladas (
                        {anuladasLines.length})
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
          </CardContent>
        </Card>

        {/* Footer actions */}
        <div className="flex justify-center gap-3 pb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/contabilidad")}
            disabled={loading}
            className="px-8 text-sm font-bold uppercase tracking-wide"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGuardar}
            disabled={loading || !puntoVenta || !platosVendidos}
            size="lg"
            className="px-10 text-sm font-bold uppercase tracking-wide"
          >
            {loading ? (
              <>
                <Spinner className="mr-2" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </Button>
        </div>
      </div>

      {/* Anular modal — lives outside the card to avoid z-index issues */}
      {anularTargetIndex !== null && (
        <AnularMovimientoModal
          open={anularModalOpen}
          onClose={() => {
            setAnularModalOpen(false);
            setAnularTargetIndex(null);
          }}
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
