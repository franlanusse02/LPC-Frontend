import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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
import { Combobox } from "@/components/ui/combobox";
import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";
import type { ConsumidorResponse } from "@/domain/dto/consumo/ConsumidorResponse";
import type { PuntoDeVentaResponse } from "@/domain/dto/pto-venta/PuntoDeVentaResponse";
import type { ProductoResponse } from "@/domain/dto/consumo/ProductoResponse";
import type { CreateConsumoRequest } from "@/domain/dto/consumo/CreateConsumoRequest";

export default function NuevoConsumoPage({ basePath = "/encargado" }: { basePath?: string }) {
  const navigate = useNavigate();
  const { get, post } = useApi();

  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [consumidores, setConsumidores] = useState<ConsumidorResponse[]>([]);
  const [puntosDeVenta, setPuntosDeVenta] = useState<PuntoDeVentaResponse[]>(
    [],
  );
  const [productos, setProductos] = useState<ProductoResponse[]>([]);

  const [comedorId, setComedorId] = useState("");
  const [consumidorId, setConsumidorId] = useState("");
  const [puntoDeVentaId, setPuntoDeVentaId] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [observaciones, setObservaciones] = useState("");
  const [lines, setLines] = useState<ProductoLine[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      get("/comedores").then((r) => r.json()),
      get("/consumos/consumidores/all").then((r) => r.json()),
      get("/comedores/puntos-de-venta").then((r) => r.json()),
      get("/consumos/productos").then((r) => r.json()),
    ]).then(([comedoresData, consumidoresData, pvData, productosData]) => {
      setComedores(comedoresData);
      setConsumidores(consumidoresData);
      setPuntosDeVenta(pvData);
      setProductos(productosData);
    });
  }, [get]);

  const consumidoresFiltrados = useMemo(
    () =>
      comedorId
        ? consumidores.filter((c) => c.comedorId === Number(comedorId) && c.activo)
        : consumidores.filter((c) => c.activo),
    [consumidores, comedorId],
  );

  const puntosFiltrados = useMemo(
    () =>
      comedorId
        ? puntosDeVenta.filter((p) => p.comedorId === Number(comedorId))
        : puntosDeVenta,
    [puntosDeVenta, comedorId],
  );

  const productosFiltrados = useMemo(
    () =>
      comedorId
        ? productos.filter((p) => p.comedorId === Number(comedorId) && p.activo)
        : productos.filter((p) => p.activo),
    [productos, comedorId],
  );

  useEffect(() => {
    if (!comedorId) {
      setLines([]);
      return;
    }
    setLines(
      productos
        .filter((p) => p.comedorId === Number(comedorId) && p.activo)
        .map((p) => ({ productoId: String(p.productoId), cantidad: "0" })),
    );
  }, [comedorId, productos]);

  const handleComedorChange = (v: string) => {
    setComedorId(v);
    setConsumidorId("");
    setPuntoDeVentaId("");
  };

  const handleLineChange = (index: number, line: ProductoLine) => {
    setLines((prev) => prev.map((l, i) => (i === index ? line : l)));
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
    Boolean(consumidorId) &&
    Boolean(puntoDeVentaId) &&
    Boolean(fecha) &&
    lines.some((l) => Number(l.cantidad) > 0);

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setLoading(true);
    try {
      let resolvedConsumidorId = Number(consumidorId);
      if (consumidorId.startsWith("new:")) {
        const saved: ConsumidorResponse = await post("/consumos/consumidores", {
          nombre: consumidorId.slice(4),
          comedorId: Number(comedorId),
        }).then((r) => r.json());
        resolvedConsumidorId = saved.id;
        setConsumidores((prev) => [...prev, saved]);
        setConsumidorId(String(saved.id));
      }

      const req: CreateConsumoRequest = {
        puntoDeVentaId: Number(puntoDeVentaId),
        consumidorId: resolvedConsumidorId,
        fecha,
        observaciones: observaciones || undefined,
        productos: lines.reduce(
          (acc, l) => {
            const cant = Number(l.cantidad);
            if (cant > 0) acc[Number(l.productoId)] = cant;
            return acc;
          },
          {} as Record<number, number>,
        ),
      };

      await post("/consumos", req);

      toast("Consumo creado", {
        description: `Consumo registrado por ${fmtCurrency(total)}.`,
      });
      navigate(`${basePath}/consumos`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear el consumo");
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
          onClick={() => navigate(`${basePath}/consumos`)}
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
            <div className="flex flex-col gap-8">
              {/* Left column */}
              <div className="flex-1 min-w-0 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Comedor *</label>
                  <Combobox
                    options={comedores.map((c) => ({
                      value: String(c.id),
                      label: c.nombre,
                    }))}
                    value={comedorId}
                    onChange={handleComedorChange}
                    placeholder="Seleccionar comedor..."
                    className="w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Consumidor *</label>
                  <Combobox
                    options={consumidoresFiltrados.map((c) => ({
                      value: String(c.id),
                      label: c.nombre,
                    }))}
                    value={consumidorId}
                    onChange={(v) => {
                      setConsumidorId(v);
                      setPuntoDeVentaId("");
                    }}
                    placeholder={!comedorId ? "Seleccioná un comedor primero..." : "Seleccionar consumidor..."}
                    disabled={!comedorId}
                    creatable
                    className="w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Punto de Venta *
                  </label>
                  <Combobox
                    options={puntosFiltrados.map((p) => ({ value: String(p.id), label: p.nombre }))}
                    value={puntoDeVentaId}
                    onChange={setPuntoDeVentaId}
                    disabled={!comedorId}
                    placeholder="Seleccionar punto de venta..."
                    className="w-full"
                  />
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
              <div className="flex-1 min-w-0">
                <h3 className="mb-4 text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Productos
                </h3>

                {!comedorId ? (
                  <p className="text-center text-sm text-muted-foreground">
                    Seleccioná un comedor para ver los productos.
                  </p>
                ) : (
                  <>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          <th className="py-2 pr-3">Producto</th>
                          <th className="py-2 px-3 text-right">Precio</th>
                          <th className="py-2 px-3">Cant.</th>
                          <th className="py-2 pl-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productosFiltrados.map((p) => {
                          const idx = lines.findIndex(
                            (l) => l.productoId === String(p.productoId),
                          );
                          const cantidad = idx >= 0 ? lines[idx].cantidad : "0";
                          return (
                            <ProductoLineRow
                              key={p.productoId}
                              producto={p}
                              cantidad={cantidad}
                              onChange={(c) =>
                                handleLineChange(idx, {
                                  productoId: String(p.productoId),
                                  cantidad: c,
                                })
                              }
                            />
                          );
                        })}
                      </tbody>
                    </table>

                    <div className="mt-3 flex justify-end border-t pt-3">
                      <span className="text-sm font-bold text-gray-700">
                        Total: {fmtCurrency(total)}
                      </span>
                    </div>
                  </>
                )}
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
