import { Fragment, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CircleDollarSign } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { FacturaProveedorResponse } from "@/domain/dto/compra/FacturaProveedorResponse";

export default function PagarFacturaPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { get, patch } = useApi();

  const [factura, setFactura] = useState<FacturaProveedorResponse | null>(null);
  const [fechaPago, setFechaPago] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    get(`/compras/facturas/${id}`)
      .then((r) => r.json())
      .then(setFactura);
  }, [id, get]);

  const handleSubmit = async () => {
    if (!id || !fechaPago) return;

    setLoading(true);
    try {
      await patch(`/compras/facturas/${id}/pagar`, { fechaPago });
      toast("Pago registrado", {
        description: `Pago de factura #${factura?.numero} registrado exitosamente.`,
      });
      navigate("/contabilidad/compras");
    } catch (err) {
      toast("Error", {
        description:
          err instanceof Error ? err.message : "No se pudo registrar el pago",
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
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CircleDollarSign className="h-5 w-5" />
              </span>
              <CardTitle className="text-xl font-bold uppercase tracking-wide">
                Registrar Pago - Factura #{factura.numero}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-5 max-w-md">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Fecha de pago *</label>
                <Input
                  type="date"
                  value={fechaPago}
                  onChange={(e) => setFechaPago(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-center">
          <Button
            onClick={handleSubmit}
            disabled={loading || !fechaPago}
            size="lg"
            className="px-10 bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {loading ? (
              <>
                <Spinner className="mr-2" />
                Registrando...
              </>
            ) : (
              "Confirmar Pago"
            )}
          </Button>
        </div>
      </div>
    </Fragment>
  );
}
