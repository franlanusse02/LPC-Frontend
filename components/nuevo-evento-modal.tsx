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
import { CreateEventoRequest } from "@/models/dto/evento/CreateEventoRequest";
import { MedioPago, MediosPagoDict } from "@/models/enums/MedioPago";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/models/dto/ApiError";
import { TipoEventoResponse } from "@/models/dto/tipo-evento/TipoEventoResponse";
import { EdificioResponse } from "@/models/dto/edificio/EdificioResponse";
import { SalaResponse } from "@/models/dto/sala/SalaResponse";

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
  comedores: ComedorResponse[];
  onConfirm: (req: CreateEventoRequest) => Promise<void>;
}

export function NuevoEventoModal({ open, onClose, token, comedores, onConfirm }: NuevoEventoModalProps) {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [loadingTipos, setLoadingTipos] = useState(false);
  const [loadingEdificios, setLoadingEdificios] = useState(false);
  const [loadingSalas, setLoadingSalas] = useState(false);

  const [tiposEvento, setTiposEvento] = useState<TipoEventoResponse[]>([]);
  const [edificios, setEdificios] = useState<EdificioResponse[]>([]);
  const [salas, setSalas] = useState<SalaResponse[]>([]);

  const [comedorId, setComedorId] = useState("");
  const [tipoEventoId, setTipoEventoId] = useState("");
  const [edificioId, setEdificioId] = useState("");
  const [salaId, setSalaId] = useState("");

  const [fechaEvento, setFechaEvento] = useState("");
  const [solicitante, setSolicitante] = useState("");
  const [cantidadPersonas, setCantidadPersonas] = useState("");
  const [montoTotal, setMontoTotal] = useState("");

  const [funcionario, setFuncionario] = useState("");
  const [centroCosto, setCentroCosto] = useState("");
  const [oficina, setOficina] = useState("");
  const [responsable, setResponsable] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [destinatarioFactura, setDestinatarioFactura] = useState("");
  const [area, setArea] = useState("");
  const [numeroOrden, setNumeroOrden] = useState("");
  const [emailSolicitante, setEmailSolicitante] = useState("");
  const [lugar, setLugar] = useState("");
  const [medioPago, setMedioPago] = useState<MedioPago | "">("");
  const [numeroOperacion, setNumeroOperacion] = useState("");
  const [concepto, setConcepto] = useState("");
  const [tipoComprobante, setTipoComprobante] = useState("");
  const [numeroComprobante, setNumeroComprobante] = useState("");

  const selectedComedor = comedores.find((c) => String(c.id) === comedorId);
  const selectedTipoEvento = tiposEvento.find((tipo) => String(tipo.id) === tipoEventoId);
  const tipoComedor = selectedComedor ? detectTipoComedor(selectedComedor.nombre) : null;
  const selectedTipoPrecio = selectedTipoEvento?.precio ?? null;

  const tipoOptions = useMemo(
    () => tiposEvento.map((tipo) => ({ value: String(tipo.id), label: tipo.nombre })),
    [tiposEvento],
  );
  const edificioOptions = useMemo(
    () => edificios.map((edificio) => ({ value: String(edificio.id), label: edificio.nombre })),
    [edificios],
  );
  const salaOptions = useMemo(
    () => salas.map((sala) => ({ value: String(sala.id), label: sala.nombre })),
    [salas],
  );

  const showEdificio = !!selectedComedor && (loadingEdificios || edificioOptions.length > 0 || !!edificioId);
  const showSala = !!edificioId && (loadingSalas || salaOptions.length > 0 || !!salaId);

  const cantidadPersonasValue = cantidadPersonas.trim() ? Number(cantidadPersonas) : null;
  const calculatedMontoTotal = selectedTipoPrecio !== null && cantidadPersonasValue !== null
    ? selectedTipoPrecio * cantidadPersonasValue
    : null;
  const requiresManualTotal = !!selectedTipoEvento && selectedTipoPrecio === null;

  useEffect(() => {
    if (open) return;
    setLoading(false);
    setLoadingTipos(false);
    setLoadingEdificios(false);
    setLoadingSalas(false);
    setTiposEvento([]);
    setEdificios([]);
    setSalas([]);
    setComedorId("");
    setTipoEventoId("");
    setEdificioId("");
    setSalaId("");
    setFechaEvento("");
    setSolicitante("");
    setCantidadPersonas("");
    setMontoTotal("");
    setFuncionario("");
    setCentroCosto("");
    setOficina("");
    setResponsable("");
    setEmpresa("");
    setDestinatarioFactura("");
    setArea("");
    setNumeroOrden("");
    setEmailSolicitante("");
    setLugar("");
    setMedioPago("");
    setNumeroOperacion("");
    setConcepto("");
    setTipoComprobante("");
    setNumeroComprobante("");
  }, [open]);

  useEffect(() => {
    if (!open || !token || !comedorId) {
      setTiposEvento([]);
      setEdificios([]);
      setSalas([]);
      setTipoEventoId("");
      setEdificioId("");
      setSalaId("");
      return;
    }

    let cancelled = false;
    setLoadingTipos(true);
    setLoadingEdificios(true);
    setTipoEventoId("");
    setEdificioId("");
    setSalaId("");
    setSalas([]);

    Promise.all([
      apiFetch<TipoEventoResponse[]>(`/api/eventos/tipos/activos?comedorId=${comedorId}`, {}, token),
      apiFetch<EdificioResponse[]>(`/api/eventos/edificios/activos?comedorId=${comedorId}`, {}, token),
    ])
      .then(([tipos, edificiosData]) => {
        if (cancelled) return;
        setTiposEvento(tipos.sort((a, b) => a.nombre.localeCompare(b.nombre)));
        setEdificios(edificiosData.sort((a, b) => a.nombre.localeCompare(b.nombre)));
      })
      .catch((error) => {
        if (cancelled) return;
        const description = error instanceof ApiError ? error.message : "No se pudieron cargar los catalogos del comedor.";
        toast({ variant: "destructive", title: "Error", description });
        setTiposEvento([]);
        setEdificios([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingTipos(false);
        setLoadingEdificios(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, token, comedorId, toast]);

  useEffect(() => {
    if (!open || !token || !edificioId) {
      setSalas([]);
      setSalaId("");
      return;
    }

    let cancelled = false;
    setLoadingSalas(true);
    setSalaId("");

    apiFetch<SalaResponse[]>(`/api/eventos/salas/activos?edificioId=${edificioId}`, {}, token)
      .then((salasData) => {
        if (cancelled) return;
        setSalas(salasData.sort((a, b) => a.nombre.localeCompare(b.nombre)));
      })
      .catch((error) => {
        if (cancelled) return;
        const description = error instanceof ApiError ? error.message : "No se pudieron cargar las salas del edificio.";
        toast({ variant: "destructive", title: "Error", description });
        setSalas([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingSalas(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, token, edificioId, toast]);

  useEffect(() => {
    if (tipoOptions.length === 1) {
      setTipoEventoId(tipoOptions[0].value);
      return;
    }
    if (tipoEventoId && !tipoOptions.some((option) => option.value === tipoEventoId)) {
      setTipoEventoId("");
    }
  }, [tipoOptions, tipoEventoId]);

  useEffect(() => {
    if (edificioOptions.length === 1) {
      setEdificioId(edificioOptions[0].value);
      return;
    }
    if (edificioId && !edificioOptions.some((option) => option.value === edificioId)) {
      setEdificioId("");
    }
  }, [edificioOptions, edificioId]);

  useEffect(() => {
    if (salaOptions.length === 1) {
      setSalaId(salaOptions[0].value);
      return;
    }
    if (salaId && !salaOptions.some((option) => option.value === salaId)) {
      setSalaId("");
    }
  }, [salaOptions, salaId]);

  const canSubmit = !!comedorId
    && !!tipoEventoId
    && !!fechaEvento
    && (!showEdificio || !!edificioId)
    && (!showSala || !!salaId)
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
        comedorId: Number(comedorId),
        tipoEventoId: Number(tipoEventoId),
        fechaEvento,
        montoTotal: finalMontoTotal,
        solicitante: s(solicitante),
        cantidadPersonas: n(cantidadPersonas),
        edificioId: edificioId ? Number(edificioId) : null,
        salaId: salaId ? Number(salaId) : null,
        funcionario: s(funcionario),
        centroCosto: s(centroCosto),
        oficina: s(oficina),
        responsable: s(responsable),
        empresa: s(empresa),
        destinatarioFactura: s(destinatarioFactura),
        area: s(area),
        numeroOrden: s(numeroOrden),
        emailSolicitante: s(emailSolicitante),
        lugar: s(lugar),
        medioPago: medioPago || null,
        numeroOperacion: s(numeroOperacion),
        concepto: s(concepto),
        tipoComprobante: s(tipoComprobante),
        numeroComprobante: s(numeroComprobante),
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const comedorOptions = comedores.map((comedor) => ({ value: String(comedor.id), label: comedor.nombre }));
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

          {selectedComedor && (
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

                {showEdificio && (
                  <FormField label="Edificio *">
                    <Combobox
                      options={edificioOptions}
                      value={edificioId}
                      onChange={setEdificioId}
                      placeholder={loadingEdificios ? "Cargando edificios..." : "Seleccionar edificio..."}
                      searchPlaceholder="Buscar edificio..."
                      emptyText="No hay edificios activos para este comedor."
                      disabled={loadingEdificios || edificioOptions.length <= 1}
                      className="bg-card"
                    />
                  </FormField>
                )}

                {showSala && (
                  <FormField label="Sala *">
                    <Combobox
                      options={salaOptions}
                      value={salaId}
                      onChange={setSalaId}
                      placeholder={loadingSalas ? "Cargando salas..." : "Seleccionar sala..."}
                      searchPlaceholder="Buscar sala..."
                      emptyText="No hay salas activas para este edificio."
                      disabled={loadingSalas || salaOptions.length <= 1}
                      className="bg-card"
                    />
                  </FormField>
                )}

                {tipoComedor === "galicia" && (
                  <>
                    <FormField label="Solicitante">
                      <Input value={solicitante} onChange={(event) => setSolicitante(event.target.value)} placeholder="Nombre" className="bg-card" />
                    </FormField>
                    <FormField label={selectedTipoPrecio !== null ? "Cantidad de personas *" : "Cantidad de personas"}>
                      <Input type="number" value={cantidadPersonas} onChange={(event) => setCantidadPersonas(event.target.value)} placeholder="0" className="bg-card" />
                    </FormField>
                    <FormField label="Funcionario">
                      <Input value={funcionario} onChange={(event) => setFuncionario(event.target.value)} placeholder="Nombre" className="bg-card" />
                    </FormField>
                    {renderTotalField(requiresManualTotal ? "Total *" : "Total")}
                    <FormField label="Centro de costo">
                      <Input value={centroCosto} onChange={(event) => setCentroCosto(event.target.value)} placeholder="Ej: CC-001" className="bg-card" />
                    </FormField>
                    <FormField label="Oficina">
                      <Input value={oficina} onChange={(event) => setOficina(event.target.value)} placeholder="Ej: Piso 4" className="bg-card" />
                    </FormField>
                    <FormField label="Responsable">
                      <Input value={responsable} onChange={(event) => setResponsable(event.target.value)} placeholder="Nombre" className="bg-card" />
                    </FormField>
                    <FormField label="Empresa">
                      <Input value={empresa} onChange={(event) => setEmpresa(event.target.value)} placeholder="Razon social" className="bg-card" />
                    </FormField>
                    <FormField label="Destinatario facturacion" className="col-span-2">
                      <Input value={destinatarioFactura} onChange={(event) => setDestinatarioFactura(event.target.value)} placeholder="Nombre o razon social" className="bg-card" />
                    </FormField>
                  </>
                )}

                {tipoComedor === "udesa" && (
                  <>
                    <FormField label="Centro de costo">
                      <Input value={centroCosto} onChange={(event) => setCentroCosto(event.target.value)} placeholder="Ej: CC-001" className="bg-card" />
                    </FormField>
                    <FormField label="Area">
                      <Input value={area} onChange={(event) => setArea(event.target.value)} placeholder="Ej: Rectorado" className="bg-card" />
                    </FormField>
                    <FormField label="Solicitante">
                      <Input value={solicitante} onChange={(event) => setSolicitante(event.target.value)} placeholder="Nombre" className="bg-card" />
                    </FormField>
                    <FormField label={selectedTipoPrecio !== null ? "Cantidad de personas *" : "Cantidad de personas"}>
                      <Input type="number" value={cantidadPersonas} onChange={(event) => setCantidadPersonas(event.target.value)} placeholder="0" className="bg-card" />
                    </FormField>
                    {renderTotalField(requiresManualTotal ? "Total *" : "Total")}
                    <FormField label="Numero de pedido">
                      <Input value={numeroOrden} onChange={(event) => setNumeroOrden(event.target.value)} placeholder="Ej: PED-0001" className="bg-card" />
                    </FormField>
                  </>
                )}

                {tipoComedor === "bbva" && (
                  <>
                    <FormField label="Solicitante">
                      <Input value={solicitante} onChange={(event) => setSolicitante(event.target.value)} placeholder="Nombre" className="bg-card" />
                    </FormField>
                    <FormField label="Email solicitante">
                      <Input type="email" value={emailSolicitante} onChange={(event) => setEmailSolicitante(event.target.value)} placeholder="correo@bbva.com" className="bg-card" />
                    </FormField>
                    <FormField label={selectedTipoPrecio !== null ? "Cantidad de personas *" : "Cantidad de personas"}>
                      <Input type="number" value={cantidadPersonas} onChange={(event) => setCantidadPersonas(event.target.value)} placeholder="0" className="bg-card" />
                    </FormField>
                    <FormField label="Lugar">
                      <Input value={lugar} onChange={(event) => setLugar(event.target.value)} placeholder="Ej: Sala A" className="bg-card" />
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
                      <Input value={numeroOperacion} onChange={(event) => setNumeroOperacion(event.target.value)} placeholder="Ej: OP-123456" className="bg-card" />
                    </FormField>
                    <FormField label="Numero de orden">
                      <Input value={numeroOrden} onChange={(event) => setNumeroOrden(event.target.value)} placeholder="Ej: ORD-0001" className="bg-card" />
                    </FormField>
                  </>
                )}

                {tipoComedor === "techint" && (
                  <>
                    <FormField label="Numero de pedido">
                      <Input value={numeroOrden} onChange={(event) => setNumeroOrden(event.target.value)} placeholder="Ej: PED-0001" className="bg-card" />
                    </FormField>
                    <FormField label="Empresa">
                      <Input value={empresa} onChange={(event) => setEmpresa(event.target.value)} placeholder="Razon social" className="bg-card" />
                    </FormField>
                    <FormField label="Concepto">
                      <Input value={concepto} onChange={(event) => setConcepto(event.target.value)} placeholder="Descripcion del evento" className="bg-card" />
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
                      <Input value={numeroComprobante} onChange={(event) => setNumeroComprobante(event.target.value)} placeholder="Ej: 0001-00001234" className="bg-card" />
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
