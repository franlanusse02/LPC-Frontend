import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Spinner } from "@/components/ui/spinner";
import { useApi } from "@/hooks/useApi";
import type { CajaChicaParaCargaResponse } from "@/domain/dto/caja-chica/CajaChicaResponse";
import type { ConceptoCajaChicaResponse } from "@/domain/dto/caja-chica/ConceptoCajaChica";
import type { CreateMovimientoCajaChicaRequest } from "@/domain/dto/caja-chica/MovimientoCajaChica";
import { MovimientoCajaChicaForm } from "../components/MovimientoCajaChicaForm";

// Write-only loading (CARGA_DATOS): pick a caja and load movimientos, never seeing saldo or history.
export default function CargarCajaChicaPage() {
  const navigate = useNavigate();
  const { get, post } = useApi();

  const [cajas, setCajas] = useState<CajaChicaParaCargaResponse[] | null>(null);
  const [conceptos, setConceptos] = useState<ConceptoCajaChicaResponse[]>([]);
  const [cajaId, setCajaId] = useState("");

  useEffect(() => {
    get("/cajas-chicas/para-carga")
      .then((r) => r.json())
      .then((data: CajaChicaParaCargaResponse[]) => {
        setCajas(data);
        if (data.length === 1) setCajaId(String(data[0].id));
      })
      .catch(() => setCajas([]));
    get("/cajas-chicas/conceptos")
      .then((r) => r.json())
      .then(setConceptos);
  }, [get]);

  const handleSubmit = async (body: CreateMovimientoCajaChicaRequest) => {
    if (!cajaId) {
      throw new Error("Elegí la caja chica.");
    }
    await post(`/cajas-chicas/${cajaId}/movimientos`, body);
    const caja = cajas?.find((c) => String(c.id) === cajaId);
    toast.success(
      `${body.tipo === "INGRESO" ? "Ingreso" : "Egreso"} cargado en ${caja?.nombre ?? "la caja"}`,
    );
  };

  if (cajas === null)
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );

  return (
    <div className="px-4 sm:px-8 lg:px-18 py-8">
      <div className="max-w-xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
      </div>

      <Card className="mx-auto max-w-xl border-0 shadow-md mt-4">
        <CardHeader className="border-b px-6 py-4">
          <CardTitle className="tracking-wide">
            <h1 className="text-xl font-bold text-gray-800 uppercase">Cargar Caja Chica</h1>
            <p className="text-sm text-gray-500 mt-1">
              Cargá ingresos y egresos. Después de guardar, el formulario queda listo para el
              siguiente.
            </p>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {cajas.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              No hay cajas chicas abiertas en las que puedas cargar.
            </p>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium">Caja chica</label>
                <Combobox
                  options={cajas.map((c) => ({
                    value: String(c.id),
                    label: c.nombre,
                    subtitle: c.comedorName ? `Comedor ${c.comedorName}` : undefined,
                  }))}
                  value={cajaId}
                  onChange={setCajaId}
                  placeholder="Elegí una caja"
                  className="w-full"
                />
              </div>
              <MovimientoCajaChicaForm conceptos={conceptos} onSubmit={handleSubmit} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
