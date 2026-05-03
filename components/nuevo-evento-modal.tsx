"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays } from "lucide-react";
import { FormField } from "./form-field";
import { DatePickerInput } from "./date-picker-input";
import { Combobox } from "@/components/ui/combobox";
import { ComedorResponse } from "@/models/dto/comedor/ComedorResponse";
import { PuntoDeVentaResponse } from "@/models/dto/pto-venta/PuntoDeVentaResponse";
import { EmpleadoComedorResponse } from "@/models/dto/empleado/EmpleadoComedorResponse";
import { CreateEventoRequest } from "@/models/dto/evento/CreateEventoRequest";
import { MedioPago, MediosPagoDict } from "@/models/enums/MedioPago";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/models/dto/ApiError";
import { TipoEventoResponse } from "@/models/dto/tipo-evento/TipoEventoResponse";

type TipoComedor = "galicia" | "udesa" | "bbva" | "techint";

function detectTipoComedor(nombre: string): TipoComedor | null {
  const n = nombre.toLowerCase();
  if (n.includes("galicia")) return "galicia";
  if (n.includes("udesa")) return "udesa";
  if (n.includes("bbva")) return "bbva";
  if (n.includes("techint")) return "techint";
  return null;
}

const TIPO_COMEDOR_LABEL: Record<TipoComedor, string> = {
  galicia: "Galicia",
  udesa: "UDESA",
  bbva: "BBVA",
  techint: "TECHINT",
};

const TIPOS_COMPROBANTE = [
  { value: "FACTURA_A", label: "Factura A" },
  { value: "FACTURA_B", label: "Factura B" },
  { value: "FACTURA_C", label: "Factura C" },
  { value: "NOTA_CREDITO_A", label: "Nota de credito A" },
  { value: "NOTA_DEBITO_A", label: "Nota de debito A" },
];

interface NuevoEventoModalProps {
  open: boolean;
  onClose: () => void;
  token: string;
  puntosDeVenta: PuntoDeVentaResponse[];
  comedores: ComedorResponse[];
  onConfirm: (req: CreateEventoRequest) => Promise<void>;
}

export function NuevoEventoModal({ open, onClose, token, puntosDeVenta, comedores, onConfirm }: NuevoEventoModalProps) {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [loadingTipos, setLoadingTipos] = useState(false);
  const [loadingEmpleados, setLoadingEmpleados] = useState(false);

  const [tiposEvento, setTiposEvento] = useState<TipoEventoResponse[]>([]);
  const [empleados, setEmpleados] = useState<EmpleadoComedorResponse[]>([]);

  const [comedorId, setComedorId] = useState("");
  const [puntoDeVentaId, setPuntoDeVentaId] = useState("");
  const [tipoEventoId, setTipoEventoId] = useState("");
  const [solicitanteId, setSolicitanteId] = useState("");
  const [funcionarioId, setFuncionarioId] = useState("");
  const [responsableId, setResponsableId] = useState("");

  const [fechaEvento, setFechaEvento] = useState("");
  const [cantidadPersonas, setCantidadPersonas] = useState("");
  const [montoTotal, setMontoTotal] = useState("");

  const [centroCosto, setCentroCosto] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [destinatarioFacturacion, setDestinatarioFacturacion] = useState("");
  const [emailSolicitante, setEmailSolicitante] = useState("");
  const [medioPago, setMedioPago] = useState<MedioPago | "">("");
  const [numeroOperacion, setNumeroOperacion] = useState("");
  const [tipoComprobante, setTipoComprobante] = useState("");
  const [numeroComprobante, setNumeroComprobante] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [retenciones, setRetenciones] = useState("");

  const selectedComedor = comedorId ? comedores.find((c) => String(c.id) === comedorId) : null;
  const tipoComedor = selectedComedor ? detectTipoComedor(selectedComedor.nombre) : null;

  const selectedTipoEvento = tiposEvento.find((t) => String(t.id) === tipoEventoId);
  const selectedTipoPrecio = selectedTipoEvento?.precio ?? null;

  const tipoOptions = useMemo(
    () => tiposEvento.map((t) => ({ value: String(t.id), label: t.nombre })),
    [tiposEvento],
  );
  const empleadoOptions = useMemo(
    () => empleados.map((e) => ({ value: String(e.id), label: e.nombre })),
    [empleados],
  );
  const comedorOptions = useMemo(
    () => comedores.map((c) => ({ value: String(c.id), label: c.nombre })),
    [comedores],
  );
  const pdvOptions = useMemo(
    () => puntosDeVenta
      .filter((p) => !comedorId || p.comedorId === Number(comedorId))
      .map((p) => ({ value: String(p.id), label: p.nombre })),
    [puntosDeVenta, comedorId],
  );

  const cantidadPersonasValue = cantidadPersonas.trim() ? Number(cantidadPersonas) : null;
  const calculatedMontoTotal = selectedTipoPrecio !== null && cantidadPersonasValue !== null
    ? selectedTipoPrecio * cantidadPersonasValue
    : null;
  const requiresManualTotal = !!selectedTipoEvento && selectedTipoPrecio === null;

  useEffect(() => {
    if (open) return;
    setLoading(false);
    setLoadingTipos(false);
    setLoadingEmpleados(false);
    setTiposEvento([]);
    setEmpleados([]);
    setComedorId("");
    setPuntoDeVentaId("");
    setTipoEventoId("");
    setSolicitanteId("");
    setFuncionarioId("");
    setResponsableId("");
    setFechaEvento("");
    setCantidadPersonas("");
    setMontoTotal("");
    setCentroCosto("");
    setRazonSocial("");
    setDestinatarioFacturacion("");
    setEmailSolicitante("");
    setMedioPago("");
    setNumeroOperacion("");
    setTipoComprobante("");
    setNumeroComprobante("");
    setObservaciones("");
    setRetenciones("");
  }, [open]);

  useEffect(() => {
    if (!open || !token || !comedorId) {
      setTiposEvento([]);
      setEmpleados([]);
      setPuntoDeVentaId("");
      setTipoEventoId("");
      setSolicitanteId("");
      setFuncionarioId("");
      setResponsableId("");
      return;
    }

    let cancelled = false;
    setLoadingTipos(true);
    setLoadingEmpleados(true);
    setPuntoDeVentaId("");
    setTipoEventoId("");
    setSolicitanteId("");
    setFuncionarioId("");
    setResponsableId("");

    Promise.all([
      apiFetch<TipoEventoResponse[]>(`/api/eventos/tipos/activos?comedorId=${comedorId}`, {}, token),
      apiFetch<EmpleadoComedorResponse[]>(`/api/comedores/empleados?comedorId=${comedorId}`, {}, token),
    ])
      .then(([tipos, empleadosData]) => {
        if (cancelled) return;
        setTiposEvento(tipos.sort((a, b) => a.nombre.localeCompare(b.nombre)));
        setEmpleados(empleadosData.filter((e) => e.activo).sort((a, b) => a.nombre.localeCompare(b.nombre)));
      })
      .catch((error) => {
        if (cancelled) return;
        const description = error instanceof ApiError ? error.message : "No se pudieron cargar los catalogos del comedor.";
        toast({ variant: "destructive", title: "Error", description });
        setTiposEvento([]);
        setEmpleados([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingTipos(false);
        setLoadingEmpleados(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, token, comedorId, toast]);

  useEffect(() => {
    if (pdvOptions.length === 1) {
      setPuntoDeVentaId(pdvOptions[0].value);
      return;
    }
    if (puntoDeVentaId && !pdvOptions.some((o) => o.value === puntoDeVentaId)) {
      setPuntoDeVentaId("");
    }
  }, [pdvOptions, puntoDeVentaId]);

  useEffect(() => {
    if (tipoOptions.length === 1) {
      setTipoEventoId(tipoOptions[0].value);
      return;
    }
    if (tipoEventoId && !tipoOptions.some((o) => o.value === tipoEventoId)) {
      setTipoEventoId("");
    }
  }, [tipoOptions, tipoEventoId]);

  const canSubmit = !!puntoDeVentaId
    && !!tipoEventoId
    && !!fechaEvento
    && (requiresManualTotal ? montoTotal.trim() !== "" : cantidadPersonas.trim() !== "" && calculatedMontoTotal !== null);

  const n = (value: string): number | null => {
    if (!value.trim()) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };
  const s = (value: string): string | null => value.trim() || null;

  const handleConfirm = async () => {
    if (!canSubmit) return;

    const finalMontoTotal = requiresManualTotal ? n(montoTotal) : calculatedMontoTotal;
    if (requiresManualTotal && finalMontoTotal === null) return;

    setLoading(true);
    try {
      await onConfirm({
        puntoDeVentaId: Number(puntoDeVentaId),
        tipoEventoId: Number(tipoEventoId),
        fechaEvento,
        solicitanteId: solicitanteId ? Number(solicitanteId) : null,
        funcionarioId: funcionarioId ? Number(funcionarioId) : null,
        responsableId: responsableId ? Number(responsableId) : null,
        cantidadPersonas: n(cantidadPersonas),
        montoTotal: finalMontoTotal,
        emailSolicitante: s(emailSolicitante),
        centroCosto: s(centroCosto),
        razonSocial: s(razonSocial),
        medioPago: medioPago || null,
        numeroOperacion: s(numeroOperacion),
        destinatarioFacturacion: s(destinatarioFacturacion),
        tipoComprobante: s(tipoComprobante),
        numeroComprobante: s(numeroComprobante),
        observaciones: s(observaciones),
        retenciones: n(retenciones),
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const totalDisplayValue = requiresManualTotal
    ? montoTotal
    : calculatedMontoTotal !== null
    ? String(calculatedMontoTotal)
    : "";

  const renderTotalField = (label: string) => (
    <FormField label={label}>
      <Input
        type="number"
        value={totalDisplayValue}
        onChange={(event) => requiresManualTotal && setMontoTotal(event.target.value)}
        placeholder={requiresManualTotal ? "0.00" : "Se calcula automaticamente"}
        className="bg-card"
        readOnly={!requiresManualTotal}
        disabled={!requiresManualTotal}
      />
    </FormField>
  );

  const renderSolicitanteField = () => (
    <FormField label="Solicitante">
      <Combobox
        options={empleadoOptions}
        value={solicitanteId}
        onChange={setSolicitanteId}
        placeholder={loadingEmpleados ? "Cargando..." : "Seleccionar solicitante..."}
        searchPlaceholder="Buscar empleado..."
        emptyText="No hay empleados activos para este comedor."
        disabled={loadingEmpleados}
        className="bg-card"
      />
    </FormField>
  );

  const renderFuncionarioField = () => (
    <FormField label="Funcionario">
      <Combobox
        options={empleadoOptions}
        value={funcionarioId}
        onChange={setFuncionarioId}
        placeholder={loadingEmpleados ? "Cargando..." : "Seleccionar funcionario..."}
        searchPlaceholder="Buscar empleado..."
        emptyText="No hay empleados activos para este comedor."
        disabled={loadingEmpleados}
        className="bg-card"
      />
    </FormField>
  );

  const renderResponsableField = () => (
    <FormField label="Responsable">
      <Combobox
        options={empleadoOptions}
        value={responsableId}
        onChange={setResponsableId}
        placeholder={loadingEmpleados ? "Cargando..." : "Seleccionar responsable..."}
        searchPlaceholder="Buscar empleado..."
        emptyText="No hay empleados activos para este comedor."
        disabled={loadingEmpleados}
        className="bg-card"
      />
    </FormField>
  );

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="sm:max-w-xl shadow-xl border-0 p-0 overflow-hidden">
        <div className="h-1.5 w-full bg-primary" />
        <div className="px-6 pt-5 pb-6 space-y-5">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CalendarDays className="h-5 w-5" />
              </span>
              <DialogTitle className="text-lg font-bold text-gray-900">
                Nuevo evento
              </DialogTitle>
            </div>
          </DialogHeader>

          <FormField label="Comedor *">
            <Combobox
              options={comedorOptions}
              value={comedorId}
              onChange={setComedorId}
              placeholder="Seleccionar comedor..."
              searchPlaceholder="Buscar comedor..."
            />
          </FormField>

          {comedorId && (
            <FormField label="Punto de venta *">
              <Combobox
                options={pdvOptions}
                value={puntoDeVentaId}
                onChange={setPuntoDeVentaId}
                placeholder="Seleccionar punto de venta..."
                searchPlaceholder="Buscar punto de venta..."
                emptyText="No hay puntos de venta para este comedor."
                disabled={pdvOptions.length <= 1 && !puntoDeVentaId}
              />
            </FormField>
          )}

          {puntoDeVentaId && (
            <>
              <FormField label="Tipo de evento *">
                <Combobox
                  options={tipoOptions}
                  value={tipoEventoId}
                  onChange={setTipoEventoId}
                  placeholder={loadingTipos ? "Cargando tipos..." : "Seleccionar tipo de evento..."}
                  searchPlaceholder="Buscar tipo de evento..."
                  emptyText="No hay tipos de evento activos para este comedor."
                  disabled={loadingTipos || tipoOptions.length <= 1}
                />
              </FormField>

              {selectedTipoEvento && (
                <p className="text-xs text-gray-500">
                  {selectedTipoPrecio !== null
                    ? `Precio unitario historico inicial: ${selectedTipoPrecio}`
                    : "Este tipo no tiene precio unitario. Debes informar el monto total manualmente."}
                </p>
              )}
            </>
          )}

          {tipoComedor && (
            <>
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-100" />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {TIPO_COMEDOR_LABEL[tipoComedor]}
                </span>
                <div className="h-px flex-1 bg-gray-100" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Fecha del evento *">
                  <DatePickerInput value={fechaEvento} onChange={setFechaEvento} className="bg-card" />
                </FormField>

                {tipoComedor === "galicia" && (
                  <>
                    {renderSolicitanteField()}
                    <FormField label={selectedTipoPrecio !== null ? "Cantidad de personas *" : "Cantidad de personas"}>
                      <Input type="number" value={cantidadPersonas} onChange={(e) => setCantidadPersonas(e.target.value)} placeholder="0" className="bg-card" />
                    </FormField>
                    {renderFuncionarioField()}
                    {renderTotalField(requiresManualTotal ? "Total *" : "Total")}
                    <FormField label="Centro de costo">
                      <Input value={centroCosto} onChange={(e) => setCentroCosto(e.target.value)} placeholder="Ej: CC-001" className="bg-card" />
                    </FormField>
                    {renderResponsableField()}
                    <FormField label="Razón social">
                      <Input value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} placeholder="Razón social" className="bg-card" />
                    </FormField>
                    <FormField label="Destinatario facturación" className="col-span-2">
                      <Input value={destinatarioFacturacion} onChange={(e) => setDestinatarioFacturacion(e.target.value)} placeholder="Nombre o razón social" className="bg-card" />
                    </FormField>
                  </>
                )}

                {tipoComedor === "udesa" && (
                  <>
                    <FormField label="Centro de costo">
                      <Input value={centroCosto} onChange={(e) => setCentroCosto(e.target.value)} placeholder="Ej: CC-001" className="bg-card" />
                    </FormField>
                    {renderSolicitanteField()}
                    <FormField label={selectedTipoPrecio !== null ? "Cantidad de personas *" : "Cantidad de personas"}>
                      <Input type="number" value={cantidadPersonas} onChange={(e) => setCantidadPersonas(e.target.value)} placeholder="0" className="bg-card" />
                    </FormField>
                    {renderTotalField(requiresManualTotal ? "Total *" : "Total")}
                  </>
                )}

                {tipoComedor === "bbva" && (
                  <>
                    {renderSolicitanteField()}
                    <FormField label="Email solicitante">
                      <Input type="email" value={emailSolicitante} onChange={(e) => setEmailSolicitante(e.target.value)} placeholder="correo@bbva.com" className="bg-card" />
                    </FormField>
                    <FormField label={selectedTipoPrecio !== null ? "Cantidad de personas *" : "Cantidad de personas"}>
                      <Input type="number" value={cantidadPersonas} onChange={(e) => setCantidadPersonas(e.target.value)} placeholder="0" className="bg-card" />
                    </FormField>
                    {renderTotalField(requiresManualTotal ? "Total *" : "Total")}
                    <FormField label="Medio de pago">
                      <Select value={medioPago} onValueChange={(value) => setMedioPago(value === "__none__" ? "" : value as MedioPago)}>
                        <SelectTrigger className="bg-card">
                          <SelectValue placeholder="Sin especificar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Sin especificar</SelectItem>
                          {Object.entries(MediosPagoDict).map(([label, value]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="Numero de operacion">
                      <Input value={numeroOperacion} onChange={(e) => setNumeroOperacion(e.target.value)} placeholder="Ej: OP-123456" className="bg-card" />
                    </FormField>
                  </>
                )}

                {tipoComedor === "techint" && (
                  <>
                    <FormField label={selectedTipoPrecio !== null ? "Cantidad de personas *" : "Cantidad de personas"}>
                      <Input type="number" min="1" step="1" value={cantidadPersonas} onChange={(e) => setCantidadPersonas(e.target.value)} placeholder="0" className="bg-card" />
                    </FormField>
                    {renderTotalField(requiresManualTotal ? "Monto *" : "Monto")}
                    <FormField label="Tipo de factura">
                      <Select value={tipoComprobante} onValueChange={(value) => setTipoComprobante(value === "__none__" ? "" : value)}>
                        <SelectTrigger className="bg-card">
                          <SelectValue placeholder="Sin especificar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Sin especificar</SelectItem>
                          {TIPOS_COMPROBANTE.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                    <FormField label="Numero de factura">
                      <Input value={numeroComprobante} onChange={(e) => setNumeroComprobante(e.target.value)} placeholder="Ej: 0001-00001234" className="bg-card" />
                    </FormField>
                  </>
                )}
              </div>
            </>
          )}

          <DialogFooter className="flex-row justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={loading} className="rounded-lg border-gray-200 text-gray-600 hover:bg-gray-50">
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={loading || !canSubmit} className="rounded-lg font-semibold">
              {loading ? <><Spinner className="mr-2 h-4 w-4" />Creando...</> : "Crear evento"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
