import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MediosPagoDict } from "@/domain/enums/MedioPago";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Combobox } from "@/components/ui/combobox";
import { cn, fmtCurrency } from "@/lib/utils";
import type { FacturaProveedorResponse } from "@/domain/dto/compra/FacturaProveedorResponse";
import type { PatchFacturaProveedorRequest } from "@/domain/dto/compra/PatchFacturaProveedorRequest";
import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";
import type { MedioPago } from "@/domain/enums/MedioPago";

type PosLinea = { puntoDeVentaId: string; monto: string; touched?: boolean };

export default function EditarFacturaPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { get, patch } = useApi();

  const [factura, setFactura] = useState<FacturaProveedorResponse | null>(null);
  const [proveedores, setProveedores] = useState<
    { id: number; nombre: string }[]
  >([]);
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);

  interface FacturaForm {
    proveedorId: string;
    comedorId: string;
    fechaFactura: string;
    monto: string;
    comentarios: string;
    puntoDeVenta: string;
    numeroOperacion: string;
    medioPago: MedioPago | "";
    numeroFactura: string;
  }
  const [form, setForm] = useState<FacturaForm>({
    proveedorId: "", comedorId: "", fechaFactura: "", monto: "",
    comentarios: "", puntoDeVenta: "", numeroOperacion: "", medioPago: "",
    numeroFactura: "",
  });
  const updateForm = (partial: Partial<FacturaForm>) => setForm(prev => ({ ...prev, ...partial }));
  const [loading, setLoading] = useState(false);
  const [posLineas, setPosLineas] = useState<PosLinea[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      get(`/facturas/proveedor/${id}`),
      get("/proveedores"),
      get("/comedores"),
    ]).then(([facturaRes, proveedoresRes, comedoresRes]) => {
      facturaRes.json().then(setFactura);
      proveedoresRes.json().then(setProveedores);
      comedoresRes.json().then(setComedores);
    });
  }, [id, get]);

  useEffect(() => {
    if (!factura) return;
    setForm({
      proveedorId: String(factura.proveedorId),
      comedorId: String(factura.comedorId),
      fechaFactura: factura.fechaFactura,
      monto: String(factura.monto),
      comentarios: factura.comentarios ?? "",
      puntoDeVenta: factura.puntoDeVentaProveedor != null ? String(factura.puntoDeVentaProveedor) : "",
      numeroOperacion: factura.numeroOperacion ?? "",
      medioPago: factura.medioPago ?? "",
      numeroFactura: factura.numero ?? "",
    });
    setPosLineas(
      factura.puntoDeVentaComedor.map((p) => ({
        puntoDeVentaId: String(p.puntoDeVentaId),
        monto: String(p.monto),
      })),
    );
  }, [factura]);

  const isPagada = factura?.estado === "PAGADA";

  const selectedComedor = comedores.find((c) => c.id === Number(form.comedorId));
  const comedorPosOptions = useMemo(
    () =>
      (selectedComedor?.puntosDeVenta ?? []).map((pv) => ({
        value: String(pv.id),
        label: pv.nombre,
      })),
    [selectedComedor],
  );

  const posSum = posLineas.reduce((s, l) => s + (Number(l.monto) || 0), 0);
  const montoNum = Number(form.monto) || 0;
  const posMismatch =
    posLineas.length > 0 && montoNum > 0 && Math.abs(posSum - montoNum) > 0.01;
  const blockSubmit = !isPagada && posMismatch;

  const redistribute = (lines: PosLinea[], total: number): PosLinea[] => {
    const touchedSum = lines.reduce(
      (s, l) => s + (l.touched ? Number(l.monto) || 0 : 0),
      0,
    );
    const untouched = lines
      .map((l, i) => (l.touched ? -1 : i))
      .filter((i) => i >= 0);
    const n = untouched.length;
    if (n === 0) return lines;
    const remaining = total - touchedSum;
    const per = Math.floor((remaining / n) * 100) / 100;
    return lines.map((l, i) => {
      const k = untouched.indexOf(i);
      if (k === -1) return l;
      const monto =
        k === n - 1
          ? Math.round((remaining - per * (n - 1)) * 100) / 100
          : per;
      return { ...l, monto: String(monto) };
    });
  };

  const addPosLinea = () => {
    setPosLineas((prev) =>
      redistribute([...prev, { puntoDeVentaId: "", monto: "" }], montoNum),
    );
  };

  const updatePosLinea = (idx: number, field: keyof PosLinea, value: string) => {
    setPosLineas((prev) =>
      prev.map((l, i) =>
        i === idx
          ? { ...l, [field]: value, ...(field === "monto" ? { touched: true } : {}) }
          : l,
      ),
    );
  };

  const removePosLinea = (idx: number) => {
    setPosLineas((prev) =>
      redistribute(prev.filter((_, i) => i !== idx), montoNum),
    );
  };

  const handleMontoChange = (value: string) => {
    updateForm({ monto: value });
    setPosLineas((prev) => redistribute(prev, Number(value) || 0));
  };

  const handleSubmit = async () => {
    if (!id || blockSubmit) return;

    setLoading(true);
    try {
      const req: PatchFacturaProveedorRequest = isPagada
        ? {
            numeroFactura: form.numeroFactura || undefined,
            numeroOperacion: form.numeroOperacion || undefined,
          }
        : {
            proveedorId: Number(form.proveedorId),
            comedorId: Number(form.comedorId),
            fechaFactura: form.fechaFactura,
            monto: Number(form.monto),
            comentarios: form.comentarios || undefined,
            puntoDeVentaProveedor: form.puntoDeVenta ? Number(form.puntoDeVenta) : null,
            numeroFactura: form.numeroFactura || undefined,
            numeroOperacion: form.numeroOperacion || undefined,
            medioPago: form.medioPago || null,
            puntoDeVentaComedor:
              posLineas.length > 0
                ? posLineas.map((l) => ({
                    puntoDeVentaId: Number(l.puntoDeVentaId),
                    monto: Number(l.monto),
                  }))
                : undefined,
          };

      await patch(`/facturas/proveedor/${id}`, req);

      toast("Factura actualizada", {
        description: `Factura #${factura?.numero} actualizada exitosamente.`,
      });
      navigate("/contabilidad/compras");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar la factura");
    } finally {
      setLoading(false);
    }
  };

  if (!factura) {
    return (
      <div className="flex min-h-screen items-center justify-center">
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
          onClick={() => navigate("/contabilidad/compras")}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a facturas
        </Button>

        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                <Pencil className="h-5 w-5" />
              </span>
              <CardTitle className="text-xl font-bold uppercase tracking-wide">
                Editar Factura #{factura.numero}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col gap-8 lg:flex-row">
              <div className="flex-1 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Proveedor *</label>
                  <Combobox
                    options={proveedores.map((p) => ({ value: String(p.id), label: p.nombre }))}
                    value={form.proveedorId}
                    onChange={(v) => updateForm({ proveedorId: v })}
                    placeholder="Seleccionar proveedor..."
                    className="w-full"
                    disabled={isPagada}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Comedor *</label>
                  <Combobox
                    options={comedores.map((c) => ({ value: String(c.id), label: c.nombre }))}
                    value={form.comedorId}
                    onChange={(v) => updateForm({ comedorId: v })}
                    placeholder="Seleccionar comedor..."
                    className="w-full"
                    disabled={isPagada}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Número de factura *
                  </label>
                  <Input
                    type="text"
                    value={form.numeroFactura}
                    onChange={(e) => updateForm({ numeroFactura: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Fecha factura *</label>
                  <Input
                    type="date"
                    value={form.fechaFactura}
                    onChange={(e) => updateForm({ fechaFactura: e.target.value })}
                    disabled={isPagada}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Monto *</label>
                  <Input
                    type="number"
                    min="0"
                    value={form.monto}
                    onChange={(e) => handleMontoChange(e.target.value)}
                    disabled={isPagada}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Medio de pago</label>
                  <Combobox
                    options={Object.entries(MediosPagoDict).map(([label, value]) => ({ value, label }))}
                    value={form.medioPago}
                    onChange={(v) => updateForm({ medioPago: v as MedioPago | "" })}
                    placeholder="Sin especificar"
                    clearable
                    className="w-full"
                    disabled={isPagada}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Número de operación
                  </label>
                  <Input
                    type="text"
                    value={form.numeroOperacion}
                    onChange={(e) => updateForm({ numeroOperacion: e.target.value })}
                    placeholder="Opcional"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Comentarios</label>
                  <Input
                    value={form.comentarios}
                    onChange={(e) => updateForm({ comentarios: e.target.value })}
                    placeholder="Opcional"
                    disabled={isPagada}
                  />
                </div>

                {!isPagada && form.comedorId && comedorPosOptions.length > 0 && (
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
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-center">
          <Button
            onClick={handleSubmit}
            disabled={loading || blockSubmit}
            size="lg"
            className="px-10 bg-amber-400 hover:bg-amber-500 text-white"
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
    </Fragment>
  );
}
