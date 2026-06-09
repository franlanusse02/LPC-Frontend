import { Fragment, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";
import { MediosPagoDict } from "@/domain/enums/MedioPago";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Combobox } from "@/components/ui/combobox";
import type { FacturaProveedorResponse } from "@/domain/dto/compra/FacturaProveedorResponse";
import type { PatchFacturaProveedorRequest } from "@/domain/dto/compra/PatchFacturaProveedorRequest";
import type { MedioPago } from "@/domain/enums/MedioPago";

export default function EditarFacturaPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { get, patch } = useApi();

  const [factura, setFactura] = useState<FacturaProveedorResponse | null>(null);
  const [proveedores, setProveedores] = useState<
    { id: number; nombre: string }[]
  >([]);
  const [comedores, setComedores] = useState<{ id: number; nombre: string }[]>(
    [],
  );

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
  }, [factura]);

  const handleSubmit = async () => {
    if (!id) return;

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

  const isPagada = factura.estado === "PAGADA";

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
                    onChange={(e) => updateForm({ monto: e.target.value })}
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
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-center">
          <Button
            onClick={handleSubmit}
            disabled={loading}
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
