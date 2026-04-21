import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
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
import type { ComedorResponse } from "@/modules/catalogo/types/ComedorResponse";
import type { TipoEventoResponse } from "@/modules/catalogo/types/TipoEventoResponse";
import type { CreateEventoRequest } from "@/domain/dto/evento/CreateEventoRequest";

export default function NuevoEventoPage() {
  const navigate = useNavigate();
  const { get, post } = useApi();

  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [tiposEvento, setTiposEvento] = useState<TipoEventoResponse[]>([]);

  const [comedorId, setComedorId] = useState("");
  const [tipoEventoId, setTipoEventoId] = useState("");
  const [fechaEvento, setFechaEvento] = useState(new Date().toISOString().split("T")[0]);
  const [solicitante, setSolicitante] = useState("");
  const [cantidadPersonas, setCantidadPersonas] = useState("");
  const [montoTotal, setMontoTotal] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([get("/comedores"), get("/eventos/tipos")]).then(([comedoresRes, tiposRes]) => {
      comedoresRes.json().then(setComedores);
      tiposRes.json().then((data) => setTiposEvento(Array.isArray(data) ? data : []));
    });
  }, [get]);

  const tiposFiltrados = useMemo(
    () =>
      comedorId
        ? tiposEvento.filter((t) => t.comedorId === Number(comedorId) && t.activo)
        : tiposEvento.filter((t) => t.activo),
    [tiposEvento, comedorId],
  );

  const canSubmit = comedorId && tipoEventoId && fechaEvento;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const req: CreateEventoRequest = {
        comedorId: Number(comedorId),
        tipoEventoId: Number(tipoEventoId),
        fechaEvento,
        solicitante: solicitante || null,
        cantidadPersonas: cantidadPersonas ? Number(cantidadPersonas) : null,
        montoTotal: montoTotal ? Number(montoTotal) : null,
        edificioId: null,
        salaId: null,
        funcionario: null,
        centroCosto: null,
        oficina: null,
        responsable: null,
        empresa: null,
        destinatarioFactura: null,
        area: null,
        numeroOrden: null,
        emailSolicitante: null,
        lugar: null,
        medioPago: null,
        numeroOperacion: null,
        concepto: null,
        tipoComprobante: null,
        numeroComprobante: null,
      };

      await post("/eventos", req);
      toast("Evento creado");
      navigate("/encargado/eventos");
    } catch (err) {
      toast("Error", {
        description: err instanceof Error ? err.message : "No se pudo crear el evento",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Fragment>
      <div className="mx-auto max-w-2xl px-6 py-6">
        <Button
          variant="ghost"
          className="mb-6 gap-2"
          onClick={() => navigate("/encargado/eventos")}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a eventos
        </Button>

        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="text-xl font-bold uppercase tracking-wide">Nuevo Evento</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Comedor *</label>
              <Select
                value={comedorId}
                onValueChange={(v) => {
                  setComedorId(v);
                  setTipoEventoId("");
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
              <label className="text-sm font-medium">Tipo de evento *</label>
              <Select
                value={tipoEventoId}
                onValueChange={setTipoEventoId}
                disabled={!comedorId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo de evento..." />
                </SelectTrigger>
                <SelectContent>
                  {tiposFiltrados.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Fecha del evento *</label>
              <Input
                type="date"
                value={fechaEvento}
                onChange={(e) => setFechaEvento(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Solicitante</label>
                <Input
                  value={solicitante}
                  onChange={(e) => setSolicitante(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Cantidad de personas</label>
                <Input
                  type="number"
                  min="1"
                  value={cantidadPersonas}
                  onChange={(e) => setCantidadPersonas(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Monto total</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={montoTotal}
                onChange={(e) => setMontoTotal(e.target.value)}
                placeholder="Opcional"
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
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-center">
          <Button onClick={handleSubmit} disabled={loading || !canSubmit} size="lg" className="px-10">
            {loading ? (
              <>
                <Spinner className="mr-2" />
                Guardando...
              </>
            ) : (
              "Registrar Evento"
            )}
          </Button>
        </div>
      </div>
    </Fragment>
  );
}
