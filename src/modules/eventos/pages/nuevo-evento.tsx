import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Combobox } from "@/components/ui/combobox";
import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";
import type { TipoEventoResponse } from "@/domain/dto/tipo-evento/TipoEventoResponse";
import type { EmpleadoComedorResponse } from "@/domain/dto/comedor/EmpleadoComedorResponse";
import type { CreateEventoRequest } from "@/domain/dto/evento/CreateEventoRequest";
import { getCaseFields, type CaseFields } from "@/modules/eventos/config/comedorCases";

export default function NuevoEventoPage() {
  const navigate = useNavigate();
  const { get, post } = useApi();

  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [tiposEvento, setTiposEvento] = useState<TipoEventoResponse[]>([]);
  const [empleados, setEmpleados] = useState<EmpleadoComedorResponse[]>([]);

  const [comedorId, setComedorId] = useState("");
  const [puntoDeVentaId, setPuntoDeVentaId] = useState("");
  const [tipoEventoId, setTipoEventoId] = useState("");
  const [fechaEvento, setFechaEvento] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [solicitanteId, setSolicitanteId] = useState("");
  const [emailSolicitante, setEmailSolicitante] = useState("");
  const [funcionarioId, setFuncionarioId] = useState("");
  const [responsableId, setResponsableId] = useState("");
  const [centroCosto, setCentroCosto] = useState("");
  const [partida, setPartida] = useState("");
  const [area, setArea] = useState("");
  const [cantidadPersonas, setCantidadPersonas] = useState("");
  const [montoTotal, setMontoTotal] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([get("/comedores"), get("/eventos/tipos")]).then(
      ([comedoresRes, tiposRes]) => {
        comedoresRes.json().then(setComedores);
        tiposRes
          .json()
          .then((data) =>
            setTiposEvento(Array.isArray(data) ? data : []),
          );
      },
    );
  }, [get]);

  const selectedComedor = comedores.find((c) => c.id === Number(comedorId));
  const caseFields: CaseFields = useMemo(
    () => getCaseFields(selectedComedor?.nombre),
    [selectedComedor?.nombre],
  );

  const posOptions = useMemo(
    () =>
      (selectedComedor?.puntosDeVenta ?? []).map((p) => ({
        value: String(p.id),
        label: p.nombre,
      })),
    [selectedComedor],
  );

  const tiposFiltrados = useMemo(
    () =>
      comedorId
        ? tiposEvento.filter(
            (t) => t.comedorId === Number(comedorId) && t.activo,
          )
        : tiposEvento.filter((t) => t.activo),
    [tiposEvento, comedorId],
  );

  const selectedTipo = tiposFiltrados.find(
    (t) => t.id === Number(tipoEventoId),
  );

  useEffect(() => {
    if (!comedorId) {
      setEmpleados([]);
      return;
    }
    get(`/comedores/empleados?comedorId=${comedorId}`)
      .then((res) => res.json())
      .then((data) => setEmpleados(Array.isArray(data) ? data : []));
  }, [comedorId, get]);

  const empleadoOptions = useMemo(
    () =>
      empleados
        .filter((e) => e.activo)
        .map((e) => ({
          value: String(e.id),
          label: e.nombre,
          subtitle: e.email || undefined,
        })),
    [empleados],
  );

  const handleComedorChange = (v: string) => {
    setComedorId(v);
    setPuntoDeVentaId("");
    setTipoEventoId("");
    setSolicitanteId("");
    setEmailSolicitante("");
    setFuncionarioId("");
    setResponsableId("");
    setCentroCosto("");
    setPartida("");
    setArea("");
  };

  useEffect(() => {
    if (!funcionarioId) {
      if (caseFields.centroCosto.autoFill === "funcionario") setCentroCosto("");
      if (caseFields.partida.autoFill === "funcionario") setPartida("");
      return;
    }
    const emp = empleados.find((e) => e.id === Number(funcionarioId));
    if (emp) {
      if (caseFields.centroCosto.autoFill === "funcionario")
        setCentroCosto(emp.centroCosto ?? "");
      if (caseFields.partida.autoFill === "funcionario")
        setPartida(emp.partida ?? "");
    }
  }, [funcionarioId, empleados, caseFields]);

  useEffect(() => {
    if (!solicitanteId) {
      setEmailSolicitante("");
      return;
    }
    const emp = empleados.find((e) => e.id === Number(solicitanteId));
    if (emp) setEmailSolicitante(emp.email ?? "");
  }, [solicitanteId, empleados]);

  const canSubmit = puntoDeVentaId && tipoEventoId && fechaEvento;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const req: CreateEventoRequest = {
        puntoDeVentaId: Number(puntoDeVentaId),
        tipoEventoId: Number(tipoEventoId),
        fechaEvento,
        solicitanteId: solicitanteId ? Number(solicitanteId) : null,
        emailSolicitante: emailSolicitante || null,
        funcionarioId: funcionarioId ? Number(funcionarioId) : null,
        responsableId: responsableId ? Number(responsableId) : null,
        cantidadPersonas: cantidadPersonas ? Number(cantidadPersonas) : null,
        montoTotal: montoTotal ? Number(montoTotal) : null,
        centroCosto: centroCosto || null,
        partida: partida || null,
        observaciones: observaciones || null,
      };

      await post("/eventos", req);
      toast("Evento creado");
      navigate("/encargado/eventos");
    } catch (err) {
      toast("Error", {
        description:
          err instanceof Error ? err.message : "No se pudo crear el evento",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
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
          <CardTitle className="text-xl font-bold uppercase tracking-wide">
            Nuevo Evento
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
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
            <label className="text-sm font-medium">Punto de Venta *</label>
            <Combobox
              options={posOptions}
              value={puntoDeVentaId}
              onChange={setPuntoDeVentaId}
              placeholder={!comedorId ? "Seleccioná un comedor primero..." : "Seleccionar punto de venta..."}
              disabled={!comedorId}
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tipo de evento *</label>
            <Combobox
              options={tiposFiltrados.map((t) => ({
                value: String(t.id),
                label: t.nombre,
                subtitle:
                  t.precio !== null ? `$${t.precio.toLocaleString("es-AR")}` : undefined,
              }))}
              value={tipoEventoId}
              onChange={setTipoEventoId}
              placeholder="Seleccionar tipo de evento..."
              disabled={!comedorId}
              className="w-full"
            />
            {selectedTipo?.precio !== null && selectedTipo?.precio !== undefined && (
              <p className="text-xs text-muted-foreground">
                Precio unitario: ${selectedTipo.precio.toLocaleString("es-AR")}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Fecha del evento *</label>
            <Input
              type="date"
              value={fechaEvento}
              onChange={(e) => setFechaEvento(e.target.value)}
            />
          </div>

          {caseFields.solicitante.visible && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Solicitante{caseFields.solicitante.required ? " *" : ""}
              </label>
              <Combobox
                options={empleadoOptions}
                value={solicitanteId}
                onChange={setSolicitanteId}
                placeholder="Seleccionar solicitante..."
                clearable
                className="w-full"
              />
            </div>
          )}

          {caseFields.emailSolicitante.visible && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Email solicitante{caseFields.emailSolicitante.required ? " *" : ""}
              </label>
              <Input
                type="email"
                value={emailSolicitante}
                onChange={(e) => setEmailSolicitante(e.target.value)}
                readOnly={!!solicitanteId}
                placeholder="email@ejemplo.com"
              />
            </div>
          )}

          {caseFields.funcionario.visible && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Funcionario{caseFields.funcionario.required ? " *" : ""}
              </label>
              <Combobox
                options={empleadoOptions}
                value={funcionarioId}
                onChange={setFuncionarioId}
                placeholder="Seleccionar funcionario..."
                clearable
                className="w-full"
              />
            </div>
          )}

          {caseFields.centroCosto.visible && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Centro de costo{caseFields.centroCosto.required ? " *" : ""}
              </label>
              <Input
                value={centroCosto}
                onChange={(e) => setCentroCosto(e.target.value)}
                readOnly={!!caseFields.centroCosto.readonly}
                placeholder={
                  caseFields.centroCosto.readonly
                    ? "Auto-completado por funcionario"
                    : "Centro de costo"
                }
              />
            </div>
          )}

          {caseFields.partida.visible && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Partida{caseFields.partida.required ? " *" : ""}
              </label>
              <Input
                value={partida}
                onChange={(e) => setPartida(e.target.value)}
                readOnly={!!caseFields.partida.readonly}
                placeholder={
                  caseFields.partida.readonly
                    ? "Auto-completado por funcionario"
                    : "Partida"
                }
              />
            </div>
          )}

          {caseFields.responsable.visible && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Responsable{caseFields.responsable.required ? " *" : ""}
              </label>
              <Combobox
                options={empleadoOptions}
                value={responsableId}
                onChange={setResponsableId}
                placeholder="Seleccionar responsable..."
                clearable
                className="w-full"
              />
            </div>
          )}

          {caseFields.area.visible && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Área{caseFields.area.required ? " *" : ""}
              </label>
              <Input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Área"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Cantidad de personas
              </label>
              <Input
                type="number"
                min="1"
                value={cantidadPersonas}
                onChange={(e) => setCantidadPersonas(e.target.value)}
                placeholder="Opcional"
              />
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
            "Registrar Evento"
          )}
        </Button>
      </div>
    </div>
  );
}
