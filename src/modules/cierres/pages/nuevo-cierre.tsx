import { Fragment, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import { MediosPagoDict } from "@/domain/enums/MedioPago";
import { useApi } from "@/hooks/useApi";
import {
  PaymentLineRow,
  type PaymentLine,
} from "../components/payment-line-row";
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

interface Comedor {
  id: number;
  nombre: string;
}

interface PuntoVenta {
  id: number;
  nombre: string;
  comedorId: number;
}

export default function NuevoCierrePage() {
  const navigate = useNavigate();
  const { get, post } = useApi();

  const [comedores, setComedores] = useState<Comedor[]>([]);
  const [puntosDeVenta, setPuntosDeVenta] = useState<PuntoVenta[]>([]);
  const [fechaOperacion, setFechaOperacion] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [comedorId, setComedorId] = useState("");
  const [puntoVentaId, setPuntoVentaId] = useState("");
  const [platosVendidos, setPlatosVendidos] = useState("");
  const [comentario, setComentario] = useState("");
  const [lines, setLines] = useState<PaymentLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [usedMedios, setUsedMedios] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([get("/comedores"), get("/comedores/puntos-de-venta")]).then(
      ([comedores, puntosDeVenta]) => {
        comedores.json().then(setComedores);
        puntosDeVenta.json().then(setPuntosDeVenta);
      },
    );
  }, [get]);

  const puntosFiltrados = puntosDeVenta.filter(
    (p) => !comedorId || String(p.comedorId) === comedorId,
  );

  const allMedios = Object.values(MediosPagoDict);
  const canAddLine = lines.length < allMedios.length;

  const handleAddLine = () => {
    setLines([
      ...lines,
      { id: null, medioPago: "", monto: "", anulacionId: null },
    ]);
  };

  const handleLineChange = (index: number, line: PaymentLine) => {
    const newLines = [...lines];
    newLines[index] = line;
    setLines(newLines);
    setUsedMedios(newLines.filter((l) => l.medioPago).map((l) => l.medioPago));
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
    setUsedMedios(
      lines
        .filter((_, i) => i !== index)
        .filter((l) => l.medioPago)
        .map((l) => l.medioPago),
    );
  };

  const handleSubmit = async () => {
    if (!puntoVentaId || !platosVendidos) {
      toast("Campos requeridos", {
        description: "Completa el punto de venta y los platos vendidos.",
      });
      return;
    }

    const validLines = lines.filter(
      (l) => l.medioPago && l.monto && Number(l.monto) > 0,
    );
    if (validLines.length !== lines.length) {
      toast("Líneas inválidas", {
        description: "Completa todas las líneas de pago correctamente.",
      });
      return;
    }

    setLoading(true);
    try {
      const cierre = await post("/cierres", {
        puntoVentaId: Number(puntoVentaId),
        fechaOperacion,
        totalPlatosVendidos: platosVendidos,
        comentarios: comentario,
      }).then((res) => res.json());

      await Promise.all(
        validLines.map((line) =>
          post("/movimientos", {
            cierreCajaId: cierre.id,
            medioPago: line.medioPago,
            monto: Number(line.monto),
          }),
        ),
      );

      toast("Cierre finalizado", {
        description: validLines.length
          ? `Se creó el cierre con ${validLines.length} línea(s) de pago.`
          : "Se creó el cierre correctamente.",
      });
      navigate("/encargado/cierres");
    } catch (err) {
      toast("Error", {
        description:
          err instanceof Error ? err.message : "No se pudo crear el cierre",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Fragment>
      <div className="mx-auto max-w-4xl px-6 py-6">
        <Button
          variant="ghost"
          className="mb-6 gap-2"
          onClick={() => navigate("/encargado/cierres")}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a cierres
        </Button>

        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="text-xl font-bold uppercase tracking-wide">
              Nuevo Cierre
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col gap-8 lg:flex-row">
              {/* Left column */}
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
                  <Select
                    value={comedorId}
                    onValueChange={(v) => {
                      setComedorId(v);
                      setPuntoVentaId("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar comedor..." />
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
                      <SelectValue placeholder="Seleccionar punto de venta..." />
                    </SelectTrigger>
                    <SelectContent>
                      {puntosFiltrados.map((p) => (
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
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              {/* Right column */}
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
                      usedMedios={usedMedios}
                      onChange={(updated) => handleLineChange(i, updated)}
                      onRemove={() => handleRemoveLine(i)}
                    />
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddLine}
                    disabled={!canAddLine}
                    className="mx-auto flex gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Nueva Línea
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-center">
          <Button
            onClick={handleSubmit}
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
              "Finalizar Cierre"
            )}
          </Button>
        </div>
      </div>
    </Fragment>
  );
}
