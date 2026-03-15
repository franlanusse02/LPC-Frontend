"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
import { apiFetch } from "@/lib/api";
import { getTodayDate } from "@/lib/dateParser";
import { ApiError } from "@/models/dto/ApiError";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { ComedorResponse } from "@/models/dto/comedor/ComedorResponse";
import { PuntoDeVentaResponse } from "@/models/dto/pto-venta/PuntoDeVentaResponse";
import { MovimientoResponse } from "@/models/dto/movimiento/MovimientoResponse";
import { CierreCajaResponse } from "@/models/dto/cierre-caja/CierreCajaResponse";
import { MediosPagoDict } from "@/models/enums/MedioPago";

export function NuevoCierreForm({
  comedores,
  puntosDeVenta,
}: {
  comedores: ComedorResponse[];
  puntosDeVenta: PuntoDeVentaResponse[];
}) {
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
    (punto) => !comedor || String(punto.comedorId) === comedor,
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

  const handleFinalizar = async () => {
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

    // Validate payment lines if any exist
    const validLines = lines.filter(
      (line) => line.medioPago && line.monto && Number(line.monto) > 0,
    );

    if (validLines.length != lines.length) {
      toast({
        variant: "destructive",
        title: "Campos invalidos",
        description:
          "Completa correctamente todos los campos de las líneas de pago.",
      });
      return;
    }

    setLoading(true);
    try {
      // 1. Create the cierre
      const cierreResponse = await apiFetch<CierreCajaResponse>(
        "/api/cierre",
        {
          method: "POST",
          body: JSON.stringify({
            puntoVentaId,
            fechaOperacion,
            totalPlatosVendidos,
            comentarios: comentario,
          }),
        },
        token,
      );

      // 2. Create movimientos for each valid payment line
      if (validLines.length > 0) {
        const movimientoPromises = validLines.map((line) =>
          apiFetch<MovimientoResponse>(
            "/api/movimiento",
            {
              method: "POST",
              body: JSON.stringify({
                cierreCajaId: cierreResponse.id,
                medioPago: line.medioPago,
                monto: Number(line.monto),
              }),
            },
            token,
          ),
        );

        await Promise.all(movimientoPromises);
      }

      // Success toast
      toast({
        title: "Cierre finalizado",
        description:
          validLines.length > 0
            ? `Se creó el cierre con ${validLines.length} línea(s) de pago.`
            : "Se creó el cierre correctamente.",
      });
      router.push("/");
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
            : "No se pudo crear el cierre";

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
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-xl font-bold uppercase tracking-wide">
            Nuevo Cierre
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
                  aria-multiline
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
        </CardContent>
      </Card>

      {/* Footer action */}
      <div className="flex justify-center pb-6">
        <Button
          onClick={handleFinalizar}
          disabled={
            loading || !puntoVenta || !platosVendidos || lines.length === 0
          }
          size="lg"
          className="px-10 text-sm font-bold uppercase tracking-wide"
        >
          {loading ? (
            <>
              <Spinner className="mr-2" />
              Guardando...
            </>
          ) : (
            "Finalizar Cierre"
          )}
        </Button>
      </div>
    </div>
  );
}
