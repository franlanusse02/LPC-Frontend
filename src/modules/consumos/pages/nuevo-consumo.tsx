import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/hooks/useApi";
import { fmtCurrency } from "@/lib/utils";
import {
  ProductoLineRow,
  type ProductoLine,
} from "../components/ProductoLineRow";
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
import type { ConsumidorResponse } from "@/domain/dto/consumo/ConsumidorResponse";
import type { PuntoDeVentaResponse } from "@/domain/dto/pto-venta/PuntoDeVentaResponse";
import type { ProductoResponse } from "@/domain/dto/consumo/ProductoResponse";
import type { CreateConsumoRequest } from "@/domain/dto/consumo/CreateConsumoRequest";

export default function NuevoConsumoPage() {
  const navigate = useNavigate();
  const { get, post } = useApi();

  const [consumidores, setConsumidores] = useState<ConsumidorResponse[]>([]);
  const [puntosDeVenta, setPuntosDeVenta] = useState<PuntoDeVentaResponse[]>(
    [],
  );
  const [productos, setProductos] = useState<ProductoResponse[]>([]);

  const [consumidorId, setConsumidorId] = useState("");
  const [puntoDeVentaId, setPuntoDeVentaId] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [observaciones, setObservaciones] = useState("");
  const [lines, setLines] = useState<ProductoLine[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      get("/consumos/consumidores/all"),
      get("/comedores/puntos-de-venta"),
      get("/consumos/productos"),
    ]).then(([consumidoresRes, pvRes, productosRes]) => {
      consumidoresRes.json().then(setConsumidores);
      pvRes.json().then(setPuntosDeVenta);
      productosRes.json().then(setProductos);
    });
  }, [get]);

  const selectedConsumidor = consumidores.find(
    (c) => String(c.id) === consumidorId,
  );

  const puntosFiltrados = useMemo(
    () =>
      selectedConsumidor
        ? puntosDeVenta.filter(
            (p) => p.comedorId === selectedConsumidor.comedorId,
          )
        : puntosDeVenta,
    [puntosDeVenta, selectedConsumidor],
  );

  const productosFiltrados = useMemo(
    () =>
      selectedConsumidor
        ? productos.filter(
            (p) => p.comedorId === selectedConsumidor.comedorId && p.activo,
          )
        : productos.filter((p) => p.activo),
    [productos, selectedConsumidor],
  );

  const usedProductoIds = lines.map((l) => l.productoId).filter(Boolean);

  const handleAddLine = () => {
    setLines((prev) => [...prev, { productoId: "", cantidad: "" }]);
  };

  const handleLineChange = (index: number, line: ProductoLine) => {
    setLines((prev) => prev.map((l, i) => (i === index ? line : l)));
  };

  const handleRemoveLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const total = useMemo(() => {
    return lines.reduce((sum, line) => {
      const producto = productosFiltrados.find(
        (p) => String(p.productoId) === line.productoId,
      );
      if (!producto || !line.cantidad) return sum;
      return sum + producto.precio * Number(line.cantidad);
    }, 0);
  }, [lines, productosFiltrados]);

  const canSubmit =
    consumidorId &&
    puntoDeVentaId &&
    fecha &&
    lines.length > 0 &&
    lines.every((l) => l.productoId && l.cantidad && Number(l.cantidad) > 0);

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setLoading(true);
    try {
      const req: CreateConsumoRequest = {
        puntoDeVentaId: Number(puntoDeVentaId),
        consumidorId: Number(consumidorId),
        fecha,
        observaciones: observaciones || undefined,
        productos: lines.reduce(
          (acc, l) => {
            acc[Number(l.productoId)] = Number(l.cantidad);
            return acc;
          },
          {} as Record<number, number>,
        ),
      };

      await post("/consumos", req);

      toast("Consumo creado", {
        description: `Consumo registrado por ${fmtCurrency(total)}.`,
      });
      navigate("/encargado/consumos");
    } catch (err) {
      toast("Error", {
        description:
          err instanceof Error ? err.message : "No se pudo crear el consumo",
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
          onClick={() => navigate("/encargado/consumos")}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a consumos
        </Button>

        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="text-xl font-bold uppercase tracking-wide">
              Nuevo Consumo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col gap-8 lg:flex-row">
              {/* Left column */}
              <div className="flex-1 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Consumidor *</label>
                  <Select
                    value={consumidorId}
                    onValueChange={(v) => {
                      setConsumidorId(v);
                      setPuntoDeVentaId("");
                      setLines([]);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar consumidor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {consumidores
                        .filter((c) => c.activo)
                        .map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.nombre}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Punto de Venta *
                  </label>
                  <Select
                    value={puntoDeVentaId}
                    onValueChange={setPuntoDeVentaId}
                    disabled={!consumidorId}
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
                  <label className="text-sm font-medium">Fecha *</label>
                  <Input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Observaciones</label>
                  <Input
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              {/* Right column */}
              <div className="flex-1">
                <h3 className="mb-4 text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Productos
                </h3>

                <div className="space-y-4">
                  {lines.map((line, i) => (
                    <ProductoLineRow
                      key={i}
                      line={line}
                      productos={productosFiltrados}
                      usedProductoIds={usedProductoIds.filter(
                        (_, idx) => idx !== i,
                      )}
                      onChange={(updated) => handleLineChange(i, updated)}
                      onRemove={() => handleRemoveLine(i)}
                    />
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddLine}
                    disabled={
                      !consumidorId || lines.length >= productosFiltrados.length
                    }
                    className="mx-auto flex gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Producto
                  </Button>

                  {lines.length > 0 && (
                    <div className="flex justify-end border-t pt-3">
                      <span className="text-sm font-bold text-gray-700">
                        Total: {fmtCurrency(total)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-center">
          <Button
            onClick={handleSubmit}
            disabled={loading || !canSubmit}
            size="lg"
            className="px-10"
          >
            {loading ? (
              <>
                <Spinner className="mr-2" />
                Guardando...
              </>
            ) : (
              "Registrar Consumo"
            )}
          </Button>
        </div>
      </div>
    </Fragment>
  );
}
