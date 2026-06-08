import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
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
import type { CreateEventoRequest } from "@/domain/dto/evento/CreateEventoRequest";
import {
  getCaseFields,
  detectCase,
  type CaseFields,
  type ComedorCaseKey,
} from "@/modules/eventos/config/comedorCases";

type ServicioLine = { productoId: string; cantidad: string };

export default function NuevoEventoPage({ basePath = "/encargado" }: { basePath?: string }) {
  const navigate = useNavigate();
  const { get, post } = useApi();

  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const emptyComedorDeps = { empleados: [] as EmpleadoComedorResponse[], funcionarios: [] as EmpleadoComedorResponse[], centrosCosto: [] as CentroCostoResponse[], partidas: [] as PartidaResponse[], razonesSociales: [] as RazonSocialComedorResponse[], productos: [] as ProductoResponse[] };
  const [comedorDeps, setComedorDeps] = useState(emptyComedorDeps);
  const { empleados, funcionarios, centrosCosto, partidas, razonesSociales, productos } = comedorDeps;

  const [comedorId, setComedorId] = useState("");
  const [puntoDeVentaId, setPuntoDeVentaId] = useState("");
  const [fechaEvento, setFechaEvento] = useState(new Date().toISOString().split("T")[0]);
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
    get("/comedores").then((r) => r.json()).then(setComedores);
  }, [get]);

  const selectedComedor = comedores.find((c) => c.id === Number(comedorId));
  const caseKey: ComedorCaseKey = useMemo(() => detectCase(selectedComedor?.nombre), [selectedComedor?.nombre]);
  const caseFields: CaseFields = useMemo(() => getCaseFields(selectedComedor?.nombre), [selectedComedor?.nombre]);

  const posOptions = useMemo(
    () => (selectedComedor?.puntosDeVenta ?? []).map((p) => ({ value: String(p.id), label: p.nombre })),
    [selectedComedor],
  );

  useEffect(() => {
    if (!comedorId) {
      setComedorDeps(emptyComedorDeps);
      return;
    }
    Promise.all([
      get(`/comedores/empleados?comedorId=${comedorId}`).then((r) => r.json()),
      get(`/comedores/empleados/funcionarios?comedorId=${comedorId}`).then((r) => r.json()),
      get(`/comedores/centros-costo?comedorId=${comedorId}`).then((r) => r.json()),
      get(`/comedores/partidas?comedorId=${comedorId}`).then((r) => r.json()),
      get(`/comedores/razon-social?comedorId=${comedorId}`).then((r) => r.json()),
      get(`/consumos/productos?comedorId=${comedorId}`).then((r) => r.json()),
    ]).then(([emp, func, cc, part, rs, prod]) => {
      setComedorDeps({ empleados: emp, funcionarios: func, centrosCosto: cc, partidas: part, razonesSociales: rs, productos: prod });
    });
  }, [comedorId, get]);

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

  const resetPerComedorFields = () => {
    setSolicitanteId(""); setEmailSolicitante(""); setFuncionarioId(""); setResponsableId("");
    setCentroCostoId(""); setPartidaId(""); setPrecioUnitario(""); setRetenciones("");
    setNumeroOperacion(""); setRazonSocialId(""); setDestinatarioFacturacion("");
    setTipoComprobante(""); setNumeroComprobante(""); setOrdenCompra("");
    setLegajoId(""); setRecepcionId(""); setNumeroPedido(""); setConcepto("");
    setAreaId(""); setAdicionales(""); setServicios([]);
  };

  const handleComedorChange = (v: string) => {
    setComedorId(v);
    setPuntoDeVentaId("");
    resetPerComedorFields();
  };

  useEffect(() => {
    let ccId: string | undefined;
    let pId: string | undefined;

    if (!funcionarioId) {
      if (caseFields.centroCosto.autoFill === "funcionario") ccId = "";
      if (caseFields.partida.autoFill === "funcionario") pId = "";
    } else {
      const emp = funcionarios.find((e) => e.id === Number(funcionarioId))
        ?? empleados.find((e) => e.id === Number(funcionarioId));
      if (emp) {
        if (caseFields.centroCosto.autoFill === "funcionario")
          ccId = emp.centroCostoId ? String(emp.centroCostoId) : "";
        if (caseFields.partida.autoFill === "funcionario")
          pId = emp.partidaId ? String(emp.partidaId) : "";
      }
    }

    if (ccId !== undefined) setCentroCostoId(ccId);
    if (pId !== undefined) setPartidaId(pId);
  }, [funcionarioId, funcionarios, empleados, caseFields]);

  useEffect(() => {
    if (!solicitanteId) return;
    const emp = empleados.find((e) => e.id === Number(solicitanteId));
    if (emp?.email) setEmailSolicitante(emp.email);
  }, [solicitanteId, empleados]);

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

  const resolveIdOrNombre = (value: string): { id: number | null; nombre: string | null } => {
    if (!value) return { id: null, nombre: null };
    if (value.startsWith("new:")) return { id: null, nombre: value.slice(4) };
    return { id: Number(value), nombre: null };
  };

  const canSubmit = puntoDeVentaId && fechaEvento && cantidadPersonas;

  const handleSubmit = async () => {
    if (!canSubmit) return;
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
        cantidadPersonas: cantidadPersonas ? Number(cantidadPersonas) : null,
        montoTotal: hasAutoTotal ? serviciosTotal : (montoTotal ? Number(montoTotal) : null),
        observaciones: observaciones || null,
        servicios: Object.keys(serviciosMap).length > 0 ? serviciosMap : null,
      };

      let req: CreateEventoRequest;

      switch (caseKey) {
        case "GALICIA": {
          const ccGal = resolveIdOrNombre(centroCostoId);
          const partGal = resolveIdOrNombre(partidaId);
          req = {
            ...base,
            tipoComedor: "GALICIA",
            solicitanteId: solicitanteId ? Number(solicitanteId) : null,
            emailSolicitante: emailSolicitante || null,
            funcionarioId: funcionarioId ? Number(funcionarioId) : null,
            responsableId: responsableId ? Number(responsableId) : null,
            centroCostoId: ccGal.id,
            centroCostoNombre: ccGal.nombre,
            partidaId: partGal.id,
            partidaNombre: partGal.nombre,
            precioUnitario: precioUnitario ? Number(precioUnitario) : null,
            retenciones: retenciones ? Number(retenciones) : null,
            numeroOperacion: numeroOperacion || null,
            razonSocialId: razonSocialId ? Number(razonSocialId) : null,
            destinatarioFacturacion: destinatarioFacturacion || null,
            tipoComprobante: tipoComprobante || null,
            numeroComprobante: numeroComprobante || null,
          };
          break;
        }
        case "BBVA": {
          const legajo = resolveIdOrNombre(legajoId);
          const recepcion = resolveIdOrNombre(recepcionId);
          req = {
            ...base,
            tipoComedor: "BBVA",
            solicitanteId: solicitanteId ? Number(solicitanteId) : null,
            emailSolicitante: emailSolicitante || null,
            ordenCompra: ordenCompra || null,
            legajoId: legajo.id,
            legajoNombre: legajo.nombre,
            recepcionId: recepcion.id,
            recepcionNombre: recepcion.nombre,
          };
          break;
        }
        case "TECHINT":
          req = {
            ...base,
            tipoComedor: "TECHINT",
            numeroPedido: numeroPedido || null,
            razonSocialId: razonSocialId ? Number(razonSocialId) : null,
            concepto: concepto || null,
            tipoComprobante: tipoComprobante || null,
            numeroComprobante: numeroComprobante || null,
          };
          break;

        case "UDESA": {
          const ccUdesa = resolveIdOrNombre(centroCostoId);
          const areaUdesa = resolveIdOrNombre(areaId);
          req = {
            ...base,
            tipoComedor: "UDESA",
            solicitanteId: solicitanteId ? Number(solicitanteId) : null,
            centroCostoId: ccUdesa.id,
            centroCostoNombre: ccUdesa.nombre,
            areaId: areaUdesa.id,
            areaNombre: areaUdesa.nombre,
            precioUnitario: precioUnitario ? Number(precioUnitario) : null,
            adicionales: adicionales ? Number(adicionales) : null,
          };
          break;
        }
        default:
          req = { ...base };
          break;
      }

      await post("/eventos", req);
      toast("Evento creado");
      navigate(`${basePath}/eventos`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear el evento");
    } finally {
      setLoading(false);
    }
  };

  const fieldLabel: Record<string, string> = {
    solicitante: "Solicitante",
    emailSolicitante: "Email solicitante",
    funcionario: "Funcionario",
    responsable: "Responsable",
    centroCosto: "Centro de costo",
    partida: "Partida",
    precioUnitario: "Precio unitario",
    retenciones: "Retenciones",
    numeroOperacion: "Nº operación",
    razonSocial: "Razón social",
    destinatarioFacturacion: "Dest. facturación",
    tipoComprobante: "Tipo comprobante",
    numeroComprobante: "Nº comprobante",
    ordenCompra: "Orden de compra",
    legajo: "Legajo",
    recepcion: "Recepción",
    numeroPedido: "Nº pedido",
    concepto: "Concepto",
    area: "Área",
    adicionales: "Adicionales",
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
      const isCreatable = (spec.type === "centroCosto" || spec.type === "partida") && !isReadonly;
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

  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <Button variant="ghost" className="mb-6 gap-2" onClick={() => navigate(`${basePath}/eventos`)}>
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
            <Combobox
              options={comedores.map((c) => ({ value: String(c.id), label: c.nombre }))}
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
            <label className="text-sm font-medium">Fecha del evento *</label>
            <Input type="date" value={fechaEvento} onChange={(e) => setFechaEvento(e.target.value)} />
          </div>

          {visibleFieldKeys.map(renderField)}

          {comedorId && (
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
          )}

          <div className="grid grid-cols-2 gap-4">
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
        <Button onClick={handleSubmit} disabled={loading || !canSubmit} size="lg" className="px-10">
          {loading ? <><Spinner className="mr-2" />Guardando...</> : "Registrar Evento"}
        </Button>
      </div>
    </div>
  );
}
