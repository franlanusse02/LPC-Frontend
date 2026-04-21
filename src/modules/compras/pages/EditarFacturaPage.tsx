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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  const [proveedorId, setProveedorId] = useState("");
  const [comedorId, setComedorId] = useState("");
  const [fechaFactura, setFechaFactura] = useState("");
  const [monto, setMonto] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [puntoDeVenta, setPuntoDeVenta] = useState("");
  const [numeroOperacion, setNumeroOperacion] = useState("");
  const [medioPago, setMedioPago] = useState<MedioPago | "">("");
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
    setProveedorId(String(factura.proveedorId));
    setComedorId(String(factura.comedorId));
    setFechaFactura(factura.fechaFactura);
    setMonto(String(factura.monto));
    setComentarios(factura.comentarios ?? "");
    setPuntoDeVenta(
      factura.puntoDeVenta != null ? String(factura.puntoDeVenta) : "",
    );
    setNumeroOperacion(factura.numeroOperacion ?? "");
    setMedioPago(factura.medioPago ?? "");
  }, [factura]);

  const handleSubmit = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const req: PatchFacturaProveedorRequest = {
        proveedorId: Number(proveedorId),
        comedorId: Number(comedorId),
        fechaFactura,
        monto: Number(monto),
        comentarios: comentarios || undefined,
        puntoDeVenta: puntoDeVenta ? Number(puntoDeVenta) : null,
        numeroOperacion: numeroOperacion || undefined,
        medioPago: medioPago || null,
      };

      await patch(`/facturas/proveedor/${id}`, req);

      toast("Factura actualizada", {
        description: `Factura #${factura?.numero} actualizada exitosamente.`,
      });
      navigate("/contabilidad/compras");
    } catch (err) {
      toast("Error", {
        description:
          err instanceof Error
            ? err.message
            : "No se pudo actualizar la factura",
      });
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
                  <Select
                    value={proveedorId}
                    onValueChange={(v) => setProveedorId(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proveedor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {proveedores.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Comedor *</label>
                  <Select
                    value={comedorId}
                    onValueChange={(v) => setComedorId(v)}
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
                  <label className="text-sm font-medium">
                    N\u00famero de factura *
                  </label>
                  <Input
                    type="text"
                    value={factura.numero}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Fecha factura *</label>
                  <Input
                    type="date"
                    value={fechaFactura}
                    onChange={(e) => setFechaFactura(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Monto *</label>
                  <Input
                    type="number"
                    min="0"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Medio de pago</label>
                  <Select
                    value={medioPago}
                    onValueChange={(v) =>
                      setMedioPago(v === "__none__" ? "" : (v as MedioPago))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin especificar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin especificar</SelectItem>
                      {Object.entries(MediosPagoDict).map(([label, value]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    N\u00famero de operaci\u00f3n
                  </label>
                  <Input
                    type="text"
                    value={numeroOperacion}
                    onChange={(e) => setNumeroOperacion(e.target.value)}
                    placeholder="Opcional"
                  />
                </div>

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
