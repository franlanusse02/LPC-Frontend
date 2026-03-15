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
import { Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { ApiError } from "@/models/dto/ApiError";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { ComedorResponse } from "@/models/dto/comedor/ComedorResponse";
import { PuntoDeVentaResponse } from "@/models/dto/pto-venta/PuntoDeVentaResponse";
import { MovimientoResponse } from "@/models/dto/movimiento/MovimientoResponse";
import { CierreCajaResponse } from "@/models/dto/cierre-caja/CierreCajaResponse";
import { MediosPagoDict } from "@/models/enums/MedioPago";

interface EditCierreFormProps {
  comedores: ComedorResponse[];
  puntosDeVenta: PuntoDeVentaResponse[];
  /** The existing cierre data to pre-populate the form */
  cierre: CierreCajaResponse & {
    movimientos?: MovimientoResponse[];
    comedor?: { id: number; nombre: string };
    puntoDeVenta?: { id: number; nombre: string; comedorId: number };
  };
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

  // Pre-populate payment lines from existing movimientos (only non-anulados)
  const existingMovimientos = (cierre.movimientos ?? []).filter(
    (m) => !m.anulacionId,
  );
  const [lines, setLines] = useState<PaymentLine[]>(
    existingMovimientos.map((m) => ({
      medioPago: m.medioPago,
      monto: String(m.monto),
    })),
  );
  const [selectedLines, setSelectedLines] = useState<string[]>(
    existingMovimientos.map((m) => m.medioPago),
  );

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

    const validLines = lines.filter(
      (line) => line.medioPago && line.monto && Number(line.monto) > 0,
    );

    if (validLines.length !== lines.length) {
      toast({
        variant: "destructive",
        title: "Campos inválidos",
        description:
          "Completa correctamente todos los campos de las líneas de pago.",
      });
      return;
    }

    setLoading(true);
    try {
      // 1. Update the cierre via PATCH/PUT
      await apiFetch<CierreCajaResponse>(
        `/api/cierre/${cierre.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            puntoVentaId,
            fechaOperacion,
            totalPlatosVendidos,
            comentarios: comentario,
          }),
        },
        token,
      );

      // 2. Replace movimientos: delete existing ones and re-create
      // Anular existing active movimientos
      const anularPromises = existingMovimientos.map(
        (m) =>
          apiFetch(
            `/api/movimiento/${m.id}/anular`,
            { method: "POST" },
            token,
          ).catch(() => null), // best effort
      );
      await Promise.all(anularPromises);

      // Create new movimientos
      if (validLines.length > 0) {
        const createPromises = validLines.map((line) =>
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
  );
}
