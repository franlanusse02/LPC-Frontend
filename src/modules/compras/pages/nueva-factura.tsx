import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MediosPagoDict } from "@/domain/enums/MedioPago";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Combobox } from "@/components/ui/combobox";
import { cn, fmtCurrency } from "@/lib/utils";
import type { CreateFacturaProveedorRequest } from "@/domain/dto/compra/CreateFacturaProveedorRequest";
import type { ProveedorResponse } from "@/domain/dto/proveedor/ProveedorResponse";
import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";
import type { MedioPago } from "@/domain/enums/MedioPago";

type PosLinea = { puntoDeVentaId: string; monto: string };

export default function NuevaFacturaPage() {
  const navigate = useNavigate();
  const { get, post } = useApi();

  const [proveedores, setProveedores] = useState<ProveedorResponse[]>([]);
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [proveedorId, setProveedorId] = useState("");
  const [comedorId, setComedorId] = useState("");
  const [fechaFactura, setFechaFactura] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [numero, setNumero] = useState("");
  const [monto, setMonto] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [medioPago, setMedioPago] = useState<MedioPago | "">("");
  const [loading, setLoading] = useState(false);
  const [posLineas, setPosLineas] = useState<PosLinea[]>([]);

  useEffect(() => {
    Promise.all([get("/proveedores"), get("/comedores")]).then(
      ([proveedores, comedores]) => {
        proveedores.json().then(setProveedores);
        comedores.json().then(setComedores);
      },
    );
  }, [get]);

  const selectedProveedor = proveedores.find(
    (p) => p.id === Number(proveedorId),
  );
  const requiresPuntoDeVentaProveedor =
    selectedProveedor && selectedProveedor.puntosDeVenta.length > 0;

  const selectedComedor = comedores.find((c) => c.id === Number(comedorId));
  const comedorPosOptions = useMemo(
    () =>
      (selectedComedor?.puntosDeVenta ?? []).map((pv) => ({
        value: String(pv.id),
        label: pv.nombre,
      })),
    [selectedComedor],
  );

  const [puntoDeVentaProveedor, setPuntoDeVentaProveedor] = useState("");

  useEffect(() => {
    if (selectedProveedor?.formaDePagoPredeterminada) {
      setMedioPago(selectedProveedor.formaDePagoPredeterminada);
    } else {
      setMedioPago("");
    }
    setPuntoDeVentaProveedor("");
  }, [proveedorId, selectedProveedor]);

  useEffect(() => {
    setPosLineas([]);
  }, [comedorId]);

  const posSum = posLineas.reduce((s, l) => s + (Number(l.monto) || 0), 0);
  const montoNum = Number(monto) || 0;
  const posMismatch = posLineas.length > 0 && montoNum > 0 && Math.abs(posSum - montoNum) > 0.01;

  const canSubmit =
    proveedorId &&
    comedorId &&
    fechaFactura &&
    numero &&
    monto &&
    (!requiresPuntoDeVentaProveedor || puntoDeVentaProveedor) &&
    (posLineas.length === 0 || posLineas.every((l) => l.puntoDeVentaId && Number(l.monto) > 0)) &&
    !posMismatch;

  const addPosLinea = () => {
    setPosLineas((prev) => [...prev, { puntoDeVentaId: "", monto: "" }]);
  };

  const updatePosLinea = (idx: number, field: keyof PosLinea, value: string) => {
    setPosLineas((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)),
    );
  };

  const removePosLinea = (idx: number) => {
    setPosLineas((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setLoading(true);
    try {
      const req: CreateFacturaProveedorRequest = {
        numero,
        proveedorId: Number(proveedorId),
        comedorId: Number(comedorId),
        fechaFactura,
        monto: Number(monto),
        comentarios: comentarios || undefined,
        puntoDeVentaProveedor: puntoDeVentaProveedor
          ? Number(puntoDeVentaProveedor)
          : undefined,
        puntoDeVentaComedor: posLineas.map((l) => ({
          puntoDeVentaId: Number(l.puntoDeVentaId),
          monto: Number(l.monto),
        })),
        medioPago: medioPago || undefined,
      };

      await post("/facturas/proveedor", req);

      toast("Factura creada", {
        description: `Factura ${numero} creada exitosamente.`,
      });
      navigate("/encargado/compras");
    } catch (err) {
      toast("Error", {
        description:
          err instanceof Error ? err.message : "No se pudo crear la factura",
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
          onClick={() => navigate("/encargado/compras")}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a facturas
        </Button>

        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="text-xl font-bold uppercase tracking-wide">
              Nueva Factura
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col gap-8 lg:flex-row">
              <div className="flex-1 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Proveedor *</label>
                  <Combobox
                    options={proveedores.map((p) => ({ value: String(p.id), label: p.nombre }))}
                    value={proveedorId}
                    onChange={setProveedorId}
                    placeholder="Seleccionar proveedor..."
                    className="w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Comedor *</label>
                  <Combobox
                    options={comedores.map((c) => ({ value: String(c.id), label: c.nombre }))}
                    value={comedorId}
                    onChange={setComedorId}
                    placeholder="Seleccionar comedor..."
                    className="w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Numero de factura *
                  </label>
                  <Input
                    type="text"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    placeholder="Ej: 0001-00001234"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Fecha factura *</label>
                  <Input
                    type="date"
                    value={fechaFactura}
                    onChange={(e) => setFechaFactura(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Monto *</label>
                  <Input
                    type="number"
                    min="0"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Medio de pago</label>
                  <Combobox
                    options={Object.entries(MediosPagoDict).map(([label, value]) => ({ value, label }))}
                    value={medioPago}
                    onChange={(v) => setMedioPago(v as MedioPago | "")}
                    placeholder="Sin especificar"
                    clearable
                    className="w-full"
                  />
                </div>

                {requiresPuntoDeVentaProveedor && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      Punto de venta (proveedor) *
                    </label>
                    <Combobox
                      options={(selectedProveedor?.puntosDeVenta ?? []).map((pv) => ({ value: String(pv), label: String(pv) }))}
                      value={puntoDeVentaProveedor}
                      onChange={setPuntoDeVentaProveedor}
                      placeholder="Seleccionar..."
                      className="w-full"
                    />
                  </div>
                )}

                {comedorId && comedorPosOptions.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        Puntos de venta (comedor)
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addPosLinea}
                        className="gap-1.5 text-xs"
                      >
                        <Plus className="h-3.5 w-3.5" /> Agregar
                      </Button>
                    </div>

                    {posLineas.length === 0 && (
                      <p className="text-xs text-gray-400">
                        Sin split por punto de venta. Se asigna todo el monto al comedor.
                      </p>
                    )}

                    {posLineas.map((linea, idx) => {
                      const usedIds = posLineas
                        .filter((_, i) => i !== idx)
                        .map((l) => l.puntoDeVentaId);
                      const availableOptions = comedorPosOptions.filter(
                        (o) => !usedIds.includes(o.value),
                      );

                      return (
                        <div key={idx} className="flex items-end gap-2">
                          <div className="flex-1">
                            {idx === 0 && (
                              <span className="text-xs text-gray-500 mb-1 block">
                                Punto de venta
                              </span>
                            )}
                            <Combobox
                              options={availableOptions}
                              value={linea.puntoDeVentaId}
                              onChange={(v) =>
                                updatePosLinea(idx, "puntoDeVentaId", v)
                              }
                              placeholder="Seleccionar punto de venta..."
                            />
                          </div>
                          <div className="w-36">
                            {idx === 0 && (
                              <span className="text-xs text-gray-500 mb-1 block">
                                Monto
                              </span>
                            )}
                            <Input
                              type="number"
                              min="0"
                              value={linea.monto}
                              onChange={(e) =>
                                updatePosLinea(idx, "monto", e.target.value)
                              }
                              placeholder="0"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-gray-400 hover:text-red-500"
                            onClick={() => removePosLinea(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}

                    {posLineas.length > 0 && (
                      <div
                        className={cn(
                          "flex items-center justify-between rounded-md border px-3 py-2 text-sm",
                          posMismatch
                            ? "border-amber-300 bg-amber-50 text-amber-700"
                            : "border-gray-200 bg-gray-50 text-gray-600",
                        )}
                      >
                        <span>Suma puntos de venta: {fmtCurrency(posSum)}</span>
                        <span>Monto factura: {fmtCurrency(montoNum)}</span>
                        {posMismatch && (
                          <span className="text-xs font-medium">
                            Diferencia: {fmtCurrency(Math.abs(posSum - montoNum))}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Comentarios</label>
                  <Input
                    value={comentarios}
                    onChange={(e) => setComentarios(e.target.value)}
                    placeholder="Opcional"
                  />
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
              "Crear Factura"
            )}
          </Button>
        </div>
      </div>
    </Fragment>
  );
}
