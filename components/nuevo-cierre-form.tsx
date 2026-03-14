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
import {
  createCierre,
  createMovimiento,
  Comedor,
  PuntoDeVenta,
  ApiError,
} from "@/lib/api";
import { getTodayDate } from "@/lib/constants";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";

export function NuevoCierreForm({
  comedores,
  puntosDeVenta,
}: {
  comedores: Comedor[];
  puntosDeVenta: PuntoDeVenta[];
}) {
  const router = useRouter();
  const { session, logout } = useAuth();
  const { toast } = useToast();

  const [fechaOperacion, setFechaOperacion] = useState(getTodayDate());
  const [comedor, setComedor] = useState("");
  const [puntoVenta, setPuntoVenta] = useState("");
  const [platosVendidos, setPlatosVendidos] = useState("");
  const [lines, setLines] = useState<PaymentLine[]>([]);
  const [loading, setLoading] = useState(false);

  if (!session) return null;

  const { token } = session;

  const filteredPuntosDeVenta = puntosDeVenta.filter(
    (punto) => !comedor || String(punto.comedorId) === comedor,
  );

  const addLine = () => {
    setLines((prev) => [...prev, { medioPago: "", monto: "" }]);
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

    setLoading(true);
    try {
      // 1. Create the cierre
      const cierreResponse = await createCierre(token, {
        puntoVentaId,
        fechaOperacion,
        totalPlatosVendidos,
        comentarios: "",
      });

      // 2. Create movimientos for each valid payment line
      if (validLines.length > 0) {
        const movimientoPromises = validLines.map((line) =>
          createMovimiento(token, {
            cierreCajaId: cierreResponse.id,
            medioPago: line.medioPago,
            monto: Number(line.monto),
          }),
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
                        {c.name}
                      </SelectItem>
                    ))}
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
                  />
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addLine}
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
            "Finalizar Cierre"
          )}
        </Button>
      </div>
    </div>
  );
}
