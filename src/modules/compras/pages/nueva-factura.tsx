import { Fragment, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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
import type { CreateFacturaProveedorRequest } from "@/domain/dto/compra/CreateFacturaProveedorRequest";
import type { ProveedorResponse } from "@/domain/dto/proveedor/ProveedorResponse";
import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";
import type { MedioPago } from "@/domain/enums/MedioPago";

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
  const [puntoDeVenta, setPuntoDeVenta] = useState("");
  const [medioPago, setMedioPago] = useState<MedioPago | "">("");
  const [loading, setLoading] = useState(false);

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
  const requiresPuntoDeVenta =
    selectedProveedor && selectedProveedor.puntosDeVenta.length > 0;

  useEffect(() => {
    if (selectedProveedor?.formaDePagoPredeterminada) {
      setMedioPago(selectedProveedor.formaDePagoPredeterminada);
    } else {
      setMedioPago("");
    }
    setPuntoDeVenta("");
  }, [proveedorId, selectedProveedor]);

  const canSubmit =
    proveedorId &&
    comedorId &&
    fechaFactura &&
    numero &&
    monto &&
    (!requiresPuntoDeVenta || puntoDeVenta);

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
        puntoDeVenta: puntoDeVenta ? Number(puntoDeVenta) : undefined,
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
                  <Select value={proveedorId} onValueChange={setProveedorId}>
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
                  <Select value={comedorId} onValueChange={setComedorId}>
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

                {requiresPuntoDeVenta && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      Punto de venta *
                    </label>
                    <Select
                      value={puntoDeVenta}
                      onValueChange={setPuntoDeVenta}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProveedor?.puntosDeVenta.map((pv) => (
                          <SelectItem key={pv} value={String(pv)}>
                            {pv}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
