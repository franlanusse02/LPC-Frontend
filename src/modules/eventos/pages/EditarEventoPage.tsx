import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Combobox } from "@/components/ui/combobox";
import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";
import type { EmpleadoComedorResponse } from "@/domain/dto/comedor/EmpleadoComedorResponse";
import type { CentroCostoResponse } from "@/domain/dto/catalogo/CentroCostoResponse";
import type { PartidaResponse } from "@/domain/dto/catalogo/PartidaResponse";
import type { RazonSocialComedorResponse } from "@/domain/dto/comedor/RazonSocialComedorResponse";
import type { ProductoResponse } from "@/domain/dto/consumo/ProductoResponse";
import type { EventoResponse } from "@/domain/dto/evento/EventoResponse";
import type { PatchEventoRequest } from "@/domain/dto/evento/PatchEventoRequest";
import {
  getCaseFields,
  type CaseFields,
  type ComedorCaseKey,
} from "@/modules/eventos/config/comedorCases";

type ServicioLine = { productoId: string; cantidad: string };

export default function EditarEventoPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { get, patch } = useApi();

  const [evento, setEvento] = useState<EventoResponse | null>(null);
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const emptyDeps = { empleados: [] as EmpleadoComedorResponse[], funcionarios: [] as EmpleadoComedorResponse[], centrosCosto: [] as CentroCostoResponse[], partidas: [] as PartidaResponse[], razonesSociales: [] as RazonSocialComedorResponse[], productos: [] as ProductoResponse[] };
  const [deps, setDeps] = useState(emptyDeps);
  const { empleados, funcionarios, centrosCosto, partidas, razonesSociales, productos } = deps;

  const [puntoDeVentaId, setPuntoDeVentaId] = useState("");
  const [fechaEvento, setFechaEvento] = useState("");
  const [cantidadPersonas, setCantidadPersonas] = useState("");
  const [montoTotal, setMontoTotal] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [solicitanteId, setSolicitanteId] = useState("");
  const [emailSolicitante, setEmailSolicitante] = useState("");
  const [funcionarioId, setFuncionarioId] = useState("");
  const [responsableId, setResponsableId] = useState("");
  const [centroCostoId, setCentroCostoId] = useState("");
  const [partidaId, setPartidaId] = useState("");
  const [precioUnitario, setPrecioUnitario] = useState("");
  const [retenciones, setRetenciones] = useState("");
  const [numeroOperacion, setNumeroOperacion] = useState("");
  const [razonSocialId, setRazonSocialId] = useState("");
  const [destinatarioFacturacion, setDestinatarioFacturacion] = useState("");
  const [tipoComprobante, setTipoComprobante] = useState("");
  const [numeroComprobante, setNumeroComprobante] = useState("");
  const [ordenCompra, setOrdenCompra] = useState("");
  const [legajoId, setLegajoId] = useState("");
  const [recepcionId, setRecepcionId] = useState("");
  const [numeroPedido, setNumeroPedido] = useState("");
  const [concepto, setConcepto] = useState("");
  const [areaId, setAreaId] = useState("");
  const [adicionales, setAdicionales] = useState("");

  const [servicios, setServicios] = useState<ServicioLine[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([get(`/eventos/${id}`), get("/comedores")]).then(
      ([eventoRes, comedoresRes]) => {
        eventoRes.json().then(setEvento);
        comedoresRes.json().then(setComedores);
      },
    );
  }, [id, get]);

  const selectedComedor = comedores.find((c) => c.id === evento?.comedorId);
  const caseKey: ComedorCaseKey = evento?.tipoComedor ?? "DEFAULT";
  const caseFields: CaseFields = useMemo(
    () => getCaseFields(selectedComedor?.nombre),
    [selectedComedor?.nombre],
  );

  const posOptions = useMemo(
    () => (selectedComedor?.puntosDeVenta ?? []).map((p) => ({ value: String(p.id), label: p.nombre })),
    [selectedComedor],
  );

  useEffect(() => {
    if (!evento?.comedorId) return;
    const cid = evento.comedorId;
    Promise.all([
      get(`/comedores/empleados?comedorId=${cid}`).then((r) => r.json()),
      get(`/comedores/empleados/funcionarios?comedorId=${cid}`).then((r) => r.json()),
      get(`/comedores/centros-costo?comedorId=${cid}`).then((r) => r.json()),
      get(`/comedores/partidas?comedorId=${cid}`).then((r) => r.json()),
      get(`/comedores/razon-social?comedorId=${cid}`).then((r) => r.json()),
      get(`/consumos/productos?comedorId=${cid}`).then((r) => r.json()),
    ]).then(([emp, func, cc, part, rs, prod]) => {
      setDeps({ empleados: emp, funcionarios: func, centrosCosto: cc, partidas: part, razonesSociales: rs, productos: prod });
    });
  }, [evento?.comedorId, get]);

  useEffect(() => {
    if (!evento) return;
    setPuntoDeVentaId(String(evento.puntoDeVentaId));
    setFechaEvento(evento.fechaEvento);
    setCantidadPersonas(evento.cantidadPersonas != null ? String(evento.cantidadPersonas) : "");
    setMontoTotal(evento.montoTotal != null ? String(evento.montoTotal) : "");
    setObservaciones(evento.observaciones ?? "");
    setServicios(evento.servicios.map((s) => ({ productoId: String(s.producto.productoId), cantidad: String(s.cantidad) })));

    const ev = evento as Record<string, unknown>;
    const str = (k: string) => (ev[k] != null ? String(ev[k]) : "");
    setSolicitanteId(str("solicitanteId"));
    setEmailSolicitante(str("emailSolicitante"));
    setFuncionarioId(str("funcionarioId"));
    setResponsableId(str("responsableId"));
    setCentroCostoId(str("centroCostoId"));
    setPartidaId(str("partidaId"));
    setPrecioUnitario(str("precioUnitario"));
    setRetenciones(str("retenciones"));
    setNumeroOperacion(str("numeroOperacion"));
    setRazonSocialId(str("razonSocialId"));
    setDestinatarioFacturacion(str("destinatarioFacturacion"));
    setTipoComprobante(str("tipoComprobante"));
    setNumeroComprobante(str("numeroComprobante"));
    setOrdenCompra(str("ordenCompra"));
    setLegajoId(str("legajoId"));
    setRecepcionId(str("recepcionId"));
    setNumeroPedido(str("numeroPedido"));
    setConcepto(str("concepto"));
    setAreaId(str("areaId"));
    setAdicionales(str("adicionales"));
  }, [evento]);

  const empleadoOptions = useMemo(
    () => empleados.filter((e) => e.activo).map((e) => ({ value: String(e.id), label: e.nombre, subtitle: e.email || undefined })),
    [empleados],
  );
  const funcionarioOptions = useMemo(
    () => funcionarios.map((e) => ({ value: String(e.id), label: e.nombre, subtitle: e.email || undefined })),
    [funcionarios],
  );
  const ccOptions = useMemo(
    () => centrosCosto.filter((c) => c.activo).map((c) => ({ value: String(c.id), label: c.nombre })),
    [centrosCosto],
  );
  const partidaOptions = useMemo(
    () => partidas.filter((p) => p.activo).map((p) => ({ value: String(p.id), label: p.nombre })),
    [partidas],
  );
  const razonSocialOptions = useMemo(
    () => razonesSociales.filter((r) => r.activo).map((r) => ({ value: String(r.id), label: r.nombre })),
    [razonesSociales],
  );
  const productoOptions = useMemo(
    () => productos.filter((p) => p.activo).map((p) => ({ value: String(p.productoId), label: p.nombre, subtitle: `$${p.precio.toLocaleString("es-AR")}` })),
    [productos],
  );

  const addServicio = () => setServicios((s) => [...s, { productoId: "", cantidad: "1" }]);
  const removeServicio = (i: number) => setServicios((s) => s.filter((_, idx) => idx !== i));
  const updateServicio = (i: number, field: keyof ServicioLine, val: string) =>
    setServicios((s) => s.map((line, idx) => (idx === i ? { ...line, [field]: val } : line)));

  const serviciosTotal = useMemo(() => {
    return servicios.reduce((sum, line) => {
      const prod = productos.find((p) => p.productoId === Number(line.productoId));
      return sum + (prod ? prod.precio * Number(line.cantidad || 0) : 0);
    }, 0);
  }, [servicios, productos]);

  const hasAutoTotal = servicios.length > 0 && serviciosTotal > 0;

  const canSubmit = puntoDeVentaId && fechaEvento && (caseKey === "UDESA" || cantidadPersonas);

  const resolveIdOrNombre = (value: string): { id: number | null; nombre: string | null } => {
    if (!value) return { id: null, nombre: null };
    if (value.startsWith("new:")) return { id: null, nombre: value.slice(4) };
    return { id: Number(value), nombre: null };
  };

  const handleSubmit = async () => {
    if (!canSubmit || !id) return;
    setLoading(true);
    try {
      const serviciosMap: Record<number, number> = {};
      for (const line of servicios) {
        if (line.productoId && line.cantidad) {
          serviciosMap[Number(line.productoId)] = Number(line.cantidad);
        }
      }

      const base = {
        puntoDeVentaId: Number(puntoDeVentaId),
        fechaEvento,
        cantidadPersonas: cantidadPersonas ? Number(cantidadPersonas) : undefined,
        montoTotal: hasAutoTotal ? serviciosTotal : (montoTotal ? Number(montoTotal) : undefined),
        observaciones: observaciones || undefined,
        servicios: Object.keys(serviciosMap).length > 0 ? serviciosMap : undefined,
      };

      let req: PatchEventoRequest;

      switch (caseKey) {
        case "GALICIA": {
          const sol = resolveIdOrNombre(solicitanteId);
          const func = resolveIdOrNombre(funcionarioId);
          const resp = resolveIdOrNombre(responsableId);
          req = {
            ...base,
            tipoComedor: "GALICIA",
            solicitanteId: sol.id ?? undefined,
            solicitanteNombre: sol.nombre ?? undefined,
            emailSolicitante: emailSolicitante || undefined,
            funcionarioId: func.id ?? undefined,
            funcionarioNombre: func.nombre ?? undefined,
            responsableId: resp.id ?? undefined,
            responsableNombre: resp.nombre ?? undefined,
            precioUnitario: precioUnitario ? Number(precioUnitario) : undefined,
            retenciones: retenciones ? Number(retenciones) : undefined,
            numeroOperacion: numeroOperacion || undefined,
            razonSocialId: razonSocialId ? Number(razonSocialId) : undefined,
            destinatarioFacturacion: destinatarioFacturacion || undefined,
            tipoComprobante: tipoComprobante || undefined,
            numeroComprobante: numeroComprobante || undefined,
          };
          break;
        }
        case "BBVA": {
          const sol = resolveIdOrNombre(solicitanteId);
          req = {
            ...base,
            tipoComedor: "BBVA",
            solicitanteId: sol.id ?? undefined,
            solicitanteNombre: sol.nombre ?? undefined,
            emailSolicitante: emailSolicitante || undefined,
            ordenCompra: ordenCompra || undefined,
            legajoId: legajoId ? Number(legajoId) : undefined,
            recepcionId: recepcionId ? Number(recepcionId) : undefined,
          };
          break;
        }
        case "TECHINT":
          req = {
            ...base,
            tipoComedor: "TECHINT",
            numeroPedido: numeroPedido || undefined,
            razonSocialId: razonSocialId ? Number(razonSocialId) : undefined,
            concepto: concepto || undefined,
            tipoComprobante: tipoComprobante || undefined,
            numeroComprobante: numeroComprobante || undefined,
          };
          break;
        case "UDESA": {
          const sol = resolveIdOrNombre(solicitanteId);
          req = {
            ...base,
            tipoComedor: "UDESA",
            solicitanteId: sol.id ?? undefined,
            solicitanteNombre: sol.nombre ?? undefined,
            centroCostoId: centroCostoId ? Number(centroCostoId) : undefined,
            areaId: areaId ? Number(areaId) : undefined,
          };
          break;
        }
        default:
          req = { ...base };
          break;
      }

      await patch(`/eventos/${id}`, req);
      toast("Evento actualizado");
      navigate("/contabilidad/eventos");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar el evento");
    } finally {
      setLoading(false);
    }
  };

  const fieldLabel: Record<string, string> = {
    solicitante: "Solicitante", emailSolicitante: "Email solicitante",
    funcionario: "Funcionario", responsable: "Responsable",
    centroCosto: "Centro de costo", partida: "Partida",
    precioUnitario: "Precio unitario", retenciones: "Retenciones",
    numeroOperacion: "Nº operación", razonSocial: "Razón social",
    destinatarioFacturacion: "Dest. facturación",
    tipoComprobante: "Tipo comprobante", numeroComprobante: "Nº comprobante",
    ordenCompra: "Orden de compra", legajo: "Legajo", recepcion: "Recepción",
    numeroPedido: "Nº pedido", concepto: "Concepto",
    area: "Área", adicionales: "Adicionales",
  };

  const fieldState: Record<string, { value: string; onChange: (v: string) => void }> = {
    solicitante: { value: solicitanteId, onChange: setSolicitanteId },
    emailSolicitante: { value: emailSolicitante, onChange: setEmailSolicitante },
    funcionario: { value: funcionarioId, onChange: setFuncionarioId },
    responsable: { value: responsableId, onChange: setResponsableId },
    centroCosto: { value: centroCostoId, onChange: setCentroCostoId },
    partida: { value: partidaId, onChange: setPartidaId },
    precioUnitario: { value: precioUnitario, onChange: setPrecioUnitario },
    retenciones: { value: retenciones, onChange: setRetenciones },
    numeroOperacion: { value: numeroOperacion, onChange: setNumeroOperacion },
    razonSocial: { value: razonSocialId, onChange: setRazonSocialId },
    destinatarioFacturacion: { value: destinatarioFacturacion, onChange: setDestinatarioFacturacion },
    tipoComprobante: { value: tipoComprobante, onChange: setTipoComprobante },
    numeroComprobante: { value: numeroComprobante, onChange: setNumeroComprobante },
    ordenCompra: { value: ordenCompra, onChange: setOrdenCompra },
    legajo: { value: legajoId, onChange: setLegajoId },
    recepcion: { value: recepcionId, onChange: setRecepcionId },
    numeroPedido: { value: numeroPedido, onChange: setNumeroPedido },
    concepto: { value: concepto, onChange: setConcepto },
    area: { value: areaId, onChange: setAreaId },
    adicionales: { value: adicionales, onChange: setAdicionales },
  };

  const pickerOptions: Record<string, { value: string; label: string; subtitle?: string }[]> = {
    empleado: empleadoOptions,
    funcionario: funcionarioOptions,
    centroCosto: ccOptions,
    partida: partidaOptions,
    razonSocial: razonSocialOptions,
  };

  const renderField = (key: string) => {
    const spec = caseFields[key as keyof CaseFields];
    if (!spec.visible) return null;
    const label = fieldLabel[key] ?? key;
    const state = fieldState[key];
    const isReadonly = !!spec.readonly;

    if (spec.type && spec.type !== "text" && spec.type !== "number") {
      const opts = pickerOptions[spec.type] ?? [];
      const isCreatable = (spec.type === "empleado" || spec.type === "funcionario") && !isReadonly;
      return (
        <div key={key} className="space-y-1.5">
          <label className="text-sm font-medium">{label}{spec.required ? " *" : ""}</label>
          <Combobox
            options={opts}
            value={state.value}
            onChange={state.onChange}
            placeholder={isReadonly ? "Auto-completado" : `Seleccionar ${label.toLowerCase()}...`}
            disabled={isReadonly}
            clearable
            creatable={isCreatable}
            className="w-full"
          />
        </div>
      );
    }

    return (
      <div key={key} className="space-y-1.5">
        <label className="text-sm font-medium">{label}{spec.required ? " *" : ""}</label>
        <Input
          type={spec.type === "number" ? "number" : "text"}
          min={spec.type === "number" ? "0" : undefined}
          step={spec.type === "number" ? "0.01" : undefined}
          value={state.value}
          onChange={(e) => state.onChange(e.target.value)}
          readOnly={isReadonly}
          placeholder={isReadonly ? "Auto-completado" : label}
        />
      </div>
    );
  };

  const visibleFieldKeys = Object.keys(caseFields).filter(
    (k) => caseFields[k as keyof CaseFields].visible,
  );

  if (!evento) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const comedorName = selectedComedor?.nombre ?? String(evento.comedorId);

  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <Button variant="ghost" className="mb-6 gap-2" onClick={() => navigate("/contabilidad/eventos")}>
        <ArrowLeft className="h-4 w-4" />
        Volver a eventos
      </Button>

      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-500">
              <Pencil className="h-5 w-5" />
            </span>
            <CardTitle className="text-xl font-bold uppercase tracking-wide">
              Editar Evento #{evento.id}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Comedor</label>
            <Input type="text" value={comedorName} readOnly className="bg-gray-50" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Punto de Venta *</label>
            <Combobox
              options={posOptions}
              value={puntoDeVentaId}
              onChange={setPuntoDeVentaId}
              placeholder="Seleccionar punto de venta..."
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Fecha del evento *</label>
            <Input type="date" value={fechaEvento} onChange={(e) => setFechaEvento(e.target.value)} />
          </div>

          {visibleFieldKeys.map(renderField)}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Servicios</label>
              <Button type="button" variant="outline" size="sm" onClick={addServicio} className="gap-1">
                <Plus className="h-3 w-3" /> Agregar
              </Button>
            </div>
            {servicios.map((line, i) => (
              <div key={i} className="flex items-center gap-2">
                <Combobox
                  options={productoOptions}
                  value={line.productoId}
                  onChange={(v) => updateServicio(i, "productoId", v)}
                  placeholder="Producto..."
                  className="flex-1"
                />
                <Input
                  type="number"
                  min="1"
                  value={line.cantidad}
                  onChange={(e) => updateServicio(i, "cantidad", e.target.value)}
                  className="w-20"
                  placeholder="Cant."
                />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeServicio(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {servicios.length > 0 && serviciosTotal > 0 && (
              <p className="text-xs text-muted-foreground">
                Total servicios: ${serviciosTotal.toLocaleString("es-AR")}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {caseKey !== "UDESA" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Cantidad de personas *</label>
                <Input
                  type="number"
                  min="1"
                  value={cantidadPersonas}
                  onChange={(e) => setCantidadPersonas(e.target.value)}
                  placeholder="Cantidad"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Monto total</label>
              {hasAutoTotal ? (
                <Input
                  type="text"
                  value={`$${serviciosTotal.toLocaleString("es-AR")}`}
                  readOnly
                  className="bg-muted"
                />
              ) : (
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={montoTotal}
                  onChange={(e) => setMontoTotal(e.target.value)}
                  placeholder="Monto"
                />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Observaciones</label>
            <Input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Opcional" />
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={loading || !canSubmit}
          size="lg"
          className="px-10 bg-amber-400 hover:bg-amber-500 text-white"
        >
          {loading ? <><Spinner className="mr-2" />Guardando...</> : "Guardar Cambios"}
        </Button>
      </div>
    </div>
  );
}
