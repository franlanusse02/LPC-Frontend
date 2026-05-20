import { Fragment, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/hooks/useApi";
import { fmtCurrency } from "@/lib/utils";
import type { DetailedCierreCajaResponse } from "@/domain/dto/cierre-caja/CierreCajaResponse";
import {
  PaymentLineRow,
  type PaymentLine,
} from "../components/payment-line-row";
import { AnularMovimientoModal } from "../components/anular-movimiento-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediosPagoDict } from "@/domain/enums/MedioPago";

interface Comedor {
  id: number;
  nombre: string;
}

interface PuntoVenta {
  id: number;
  nombre: string;
  comedorId: number;
}

export default function EditarCierrePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { get, patch, post, del } = useApi();

  const [cierre, setCierre] = useState<DetailedCierreCajaResponse | null>(null);
  const [comedores, setComedores] = useState<Comedor[]>([]);
  const [puntosDeVenta, setPuntosDeVenta] = useState<PuntoVenta[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [fechaOperacion, setFechaOperacion] = useState("");
  const [comedorId, setComedorId] = useState("");
  const [puntoVentaId, setPuntoVentaId] = useState("");
  const [platosVendidos, setPlatosVendidos] = useState("");
  const [comentario, setComentario] = useState("");
  const [lines, setLines] = useState<PaymentLine[]>([]);
  const [usedMedios, setUsedMedios] = useState<string[]>([]);
  const [showAnuladas, setShowAnuladas] = useState(false);

  const [pendingAnulaciones, setPendingAnulaciones] = useState<
    { id: number; motivo: string }[]
  >([]);

  const [anularModalOpen, setAnularModalOpen] = useState(false);
  const [anularModalLine, setAnularModalLine] = useState<{
    index: number;
    line: PaymentLine;
  } | null>(null);

  useEffect(() => {
    if (!id) return;
    setInitialLoading(true);
    Promise.all([
      get(`/cierres/detailed/${id}`),
      get("/comedores"),
      get("/comedores/puntos-de-venta"),
    ]).then(async ([cierreRes, comedoresRes, puntosRes]) => {
      const cierreData = (await cierreRes.json()) as DetailedCierreCajaResponse;
      const comedoresData = (await comedoresRes.json()) as Comedor[];
      const puntosData = (await puntosRes.json()) as PuntoVenta[];

      setCierre(cierreData);
      setComedores(comedoresData);
      setPuntosDeVenta(puntosData);

      setFechaOperacion(cierreData.fechaOperacion);
      setComedorId(String(cierreData.comedor.id));
      setPuntoVentaId(String(cierreData.puntoDeVenta.id));
      setPlatosVendidos(String(cierreData.totalPlatosVendidos));
      setComentario(cierreData.comentarios || "");
      setLines(
        (cierreData.movimientos ?? []).map((m) => ({
          id: m.id,
          medioPago: m.medioPago,
          monto: String(m.monto),
          anulacionId: m.anulacionId,
        })),
      );
      setUsedMedios(
        (cierreData.movimientos ?? [])
          .filter((m) => m.anulacionId === null)
          .map((m) => m.medioPago),
      );
      setInitialLoading(false);
    });
  }, [id, get]);

  const filteredPuntosDeVenta = puntosDeVenta.filter(
    (p) => !comedorId || String(p.comedorId) === comedorId,
  );

  const activeLines = lines.filter((l) => l.anulacionId === null);
  const anuladasLines = lines.filter((l) => l.anulacionId !== null);

  const montoTotal = activeLines.reduce(
    (sum, l) => sum + (Number(l.monto) || 0),
    0,
  );

  const allMedios = Object.values(MediosPagoDict);
  const canAddLine = activeLines.length < allMedios.length;

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { id: null, medioPago: "", monto: "", anulacionId: null },
    ]);
  };

  const handleLineChange = (index: number, updated: PaymentLine) => {
    setLines((prev) => {
      const newLines = [...prev];
      newLines[index] = updated;
      return newLines;
    });
    setUsedMedios(
      lines
        .map((l, i) => (i === index ? updated.medioPago : l.medioPago))
        .filter(
          (m) =>
            m && !lines.find((l) => lines.indexOf(l) === index)?.anulacionId,
        ),
    );
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
    setUsedMedios(
      lines
        .filter((_, i) => i !== index)
        .filter((l) => l.medioPago && l.anulacionId === null)
        .map((l) => l.medioPago),
    );
  };

  const getLineModalData = (line: PaymentLine) => ({
    movimientoId: line.id || 0,
    metodoPago:
      Object.entries(MediosPagoDict).find(
        ([, v]) => v === line.medioPago,
      )?.[0] || line.medioPago,
    monto: Number(line.monto),
    puntoVenta: cierre?.puntoDeVenta.nombre || "",
  });

  const handleAnularClick = (index: number, motivo: string) => {
    const line = lines[index];
    if (line.id === null) return;

    setPendingAnulaciones((prev) => [...prev, { id: line.id!, motivo }]);
    setLines((prev) =>
      prev.map((l, i) => (i === index ? { ...l, anulacionId: -1 } : l)),
    );
    setUsedMedios((prev) => prev.filter((v) => v !== line.medioPago));
  };

  const handleGuardar = async () => {
    if (!puntoVentaId || !platosVendidos) {
      toast("Campos requeridos", {
        description: "Completa punto de venta y platos vendidos.",
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
      toast("Líneas inválidas", {
        description: "Completa correctamente todas las líneas de pago.",
      });
      return;
    }

    setLoading(true);
    try {
      // Anular movimientos first
      if (pendingAnulaciones.length > 0) {
        await Promise.all(
          pendingAnulaciones.map(({ id, motivo }) =>
            del(`/movimientos/${id}`, {
              body: JSON.stringify({ motivo }),
            }),
          ),
        );
      }

      // Patch cierre
      await patch(`/cierres/${id}`, {
        puntoDeVentaId: Number(puntoVentaId),
        fechaOperacion,
        totalPlatosVendidos: Number(platosVendidos),
        comedorId: Number(comedorId),
        comentarios: comentario,
      });

      // Create new lines
      if (validNewLines.length > 0) {
        await Promise.all(
          validNewLines.map((line) =>
            post("/movimientos", {
              cierreCajaId: Number(id),
              medioPago: line.medioPago,
              monto: Number(line.monto),
            }),
          ),
        );
      }

      toast("Cierre actualizado", {
        description: "Los cambios se guardaron correctamente.",
      });
      navigate("/contabilidad/cierres");
    } catch (err) {
      toast("Error", {
        description:
          err instanceof Error
            ? err.message
            : "No se pudo actualizar el cierre",
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading || !cierre) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <Fragment>
      <div className="mx-auto max-w-4xl px-6 py-6">
        <Button
          variant="ghost"
          className="mb-6 gap-2"
          onClick={() => navigate("/contabilidad/cierres")}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>

        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="text-xl font-bold uppercase tracking-wide">
              Editar Cierre #{id}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col gap-8 lg:flex-row">
              {/* Left — main fields */}
              <div className="flex-1 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Fecha Operación</label>
                  <Input
                    type="date"
                    value={fechaOperacion}
                    onChange={(e) => setFechaOperacion(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Comedor</label>
                  <Select value={comedorId} onValueChange={setComedorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {comedores.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Punto de Venta</label>
                  <Select
                    value={puntoVentaId}
                    onValueChange={setPuntoVentaId}
                    disabled={!comedorId}
                  >
                    <SelectTrigger>
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
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Platos Vendidos</label>
                  <Input
                    type="number"
                    min="0"
                    value={platosVendidos}
                    onChange={(e) => setPlatosVendidos(e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Comentarios</label>
                  <Input
                    type="text"
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              {/* Right — payment lines */}
              <div className="flex-1">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Líneas de Pago
                  </h3>
                  <span className="text-sm font-semibold text-muted-foreground">
                    Total:{" "}
                    <span className="text-foreground">
                      {fmtCurrency(montoTotal)}
                    </span>
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
                        usedMedios={usedMedios}
                        onChange={(updated) =>
                          handleLineChange(globalIndex, updated)
                        }
                        onRemove={() => removeLine(globalIndex)}
                        onAnular={() => {
                          setAnularModalLine({ index: globalIndex, line });
                          setAnularModalOpen(true);
                        }}
                      />
                    );
                  })}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addLine}
                    disabled={!canAddLine}
                    className="mx-auto flex gap-2"
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
                                usedMedios={usedMedios}
                                onChange={() => {}}
                                onRemove={() => {}}
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

        <div className="mt-6 flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/contabilidad/cierres")}
            disabled={loading}
            className="px-8"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGuardar}
            disabled={loading || !puntoVentaId || !platosVendidos}
            size="lg"
            className="px-10"
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

      {anularModalLine && (
        <AnularMovimientoModal
          open={anularModalOpen}
          onClose={() => {
            setAnularModalOpen(false);
            setAnularModalLine(null);
          }}
          {...getLineModalData(anularModalLine.line)}
          onConfirm={async (_, motivo) => {
            handleAnularClick(anularModalLine.index, motivo);
            setAnularModalOpen(false);
            setAnularModalLine(null);
          }}
        />
      )}
    </Fragment>
  );
}
