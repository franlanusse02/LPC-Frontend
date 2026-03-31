"use client";

import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
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

type TipoComedor = "galicia" | "udesa" | "bbva" | "techint";

function detectTipoComedor(nombre: string): TipoComedor | null {
  const n = nombre.toLowerCase();
  if (n.includes("galicia")) return "galicia";
  if (n.includes("udesa"))   return "udesa";
  if (n.includes("bbva"))    return "bbva";
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
  { value: "NOTA_CREDITO_A", label: "Nota de crédito A" },
  { value: "NOTA_DEBITO_A", label: "Nota de débito A" },
];

interface NuevoEventoModalProps {
  open: boolean;
  onClose: () => void;
  comedores: ComedorResponse[];
  onConfirm: (req: CreateEventoRequest) => Promise<void>;
}

export function NuevoEventoModal({ open, onClose, comedores, onConfirm }: NuevoEventoModalProps) {
  const [loading, setLoading] = useState(false);

  // Comedor
  const [comedorId, setComedorId] = useState("");

  // Campos comunes
  const [fechaEvento, setFechaEvento] = useState("");
  const [solicitante, setSolicitante] = useState("");
  const [cantidadPersonas, setCantidadPersonas] = useState("");
  const [montoTotal, setMontoTotal] = useState("");

  // Galicia
  const [edificio, setEdificio] = useState("");
  const [sala, setSala] = useState("");
  const [funcionario, setFuncionario] = useState("");
  const [centroCosto, setCentroCosto] = useState("");
  const [oficina, setOficina] = useState("");
  const [responsable, setResponsable] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [destinatarioFactura, setDestinatarioFactura] = useState("");

  // UDESA
  const [area, setArea] = useState("");

  // Compartido
  const [numeroOrden, setNumeroOrden] = useState("");

  // BBVA
  const [emailSolicitante, setEmailSolicitante] = useState("");
  const [lugar, setLugar] = useState("");
  const [medioPago, setMedioPago] = useState<MedioPago | "">("");
  const [numeroOperacion, setNumeroOperacion] = useState("");

  // TECHINT
  const [concepto, setConcepto] = useState("");
  const [tipoComprobante, setTipoComprobante] = useState("");
  const [numeroComprobante, setNumeroComprobante] = useState("");

  const selectedComedor = comedores.find((c) => String(c.id) === comedorId);
  const tipoComedor = selectedComedor ? detectTipoComedor(selectedComedor.nombre) : null;

  // Reset al cerrar/abrir
  useEffect(() => {
    if (!open) {
      setComedorId(""); setFechaEvento(""); setSolicitante(""); setCantidadPersonas("");
      setMontoTotal(""); setEdificio(""); setSala(""); setFuncionario(""); setCentroCosto("");
      setOficina(""); setResponsable(""); setEmpresa(""); setDestinatarioFactura("");
      setArea(""); setNumeroOrden(""); setEmailSolicitante(""); setLugar("");
      setMedioPago(""); setNumeroOperacion(""); setConcepto(""); setTipoComprobante("");
      setNumeroComprobante("");
    }
  }, [open]);

  // Reset campos específicos al cambiar de comedor
  useEffect(() => {
    setFechaEvento(""); setSolicitante(""); setCantidadPersonas(""); setMontoTotal("");
    setEdificio(""); setSala(""); setFuncionario(""); setCentroCosto(""); setOficina("");
    setResponsable(""); setEmpresa(""); setDestinatarioFactura(""); setArea("");
    setNumeroOrden(""); setEmailSolicitante(""); setLugar(""); setMedioPago("");
    setNumeroOperacion(""); setConcepto(""); setTipoComprobante(""); setNumeroComprobante("");
  }, [comedorId]);

  const canSubmit = !!comedorId && !!fechaEvento;

  const n = (v: string): number | null => v ? Number(v) : null;
  const s = (v: string): string | null => v.trim() || null;

  const handleConfirm = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await onConfirm({
        comedorId: Number(comedorId),
        fechaEvento,
        montoTotal: n(montoTotal),
        solicitante: s(solicitante),
        cantidadPersonas: n(cantidadPersonas),
        edificio: s(edificio),
        sala: s(sala),
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

  const comedorOptions = comedores.map((c) => ({ value: String(c.id), label: c.nombre }));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
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

          {/* Selector de comedor */}
          <FormField label="Comedor *">
            <Combobox
              options={comedorOptions}
              value={comedorId}
              onChange={setComedorId}
              placeholder="Seleccionar comedor..."
              searchPlaceholder="Buscar comedor..."
            />
          </FormField>

          {/* Campos específicos por comedor */}
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
                {tipoComedor === "galicia" && (
                  <>
                    <FormField label="Fecha del evento *">
                      <DatePickerInput value={fechaEvento} onChange={setFechaEvento} className="bg-card" />
                    </FormField>
                    <FormField label="Solicitante">
                      <Input value={solicitante} onChange={(e) => setSolicitante(e.target.value)} placeholder="Nombre" className="bg-card" />
                    </FormField>
                    <FormField label="Edificio">
                      <Input value={edificio} onChange={(e) => setEdificio(e.target.value)} placeholder="Ej: Edificio Norte" className="bg-card" />
                    </FormField>
                    <FormField label="Sala">
                      <Input value={sala} onChange={(e) => setSala(e.target.value)} placeholder="Ej: Sala 3" className="bg-card" />
                    </FormField>
                    <FormField label="Funcionario">
                      <Input value={funcionario} onChange={(e) => setFuncionario(e.target.value)} placeholder="Nombre" className="bg-card" />
                    </FormField>
                    <FormField label="Cantidad de personas">
                      <Input type="number" value={cantidadPersonas} onChange={(e) => setCantidadPersonas(e.target.value)} placeholder="0" className="bg-card" />
                    </FormField>
                    <FormField label="Total">
                      <Input type="number" value={montoTotal} onChange={(e) => setMontoTotal(e.target.value)} placeholder="0.00" className="bg-card" />
                    </FormField>
                    <FormField label="Centro de costo">
                      <Input value={centroCosto} onChange={(e) => setCentroCosto(e.target.value)} placeholder="Ej: CC-001" className="bg-card" />
                    </FormField>
                    <FormField label="Oficina">
                      <Input value={oficina} onChange={(e) => setOficina(e.target.value)} placeholder="Ej: Piso 4" className="bg-card" />
                    </FormField>
                    <FormField label="Responsable">
                      <Input value={responsable} onChange={(e) => setResponsable(e.target.value)} placeholder="Nombre" className="bg-card" />
                    </FormField>
                    <FormField label="Empresa">
                      <Input value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Razón social" className="bg-card" />
                    </FormField>
                    <FormField label="Destinatario facturación" className="col-span-2">
                      <Input value={destinatarioFactura} onChange={(e) => setDestinatarioFactura(e.target.value)} placeholder="Nombre o razón social" className="bg-card" />
                    </FormField>
                  </>
                )}

                {tipoComedor === "udesa" && (
                  <>
                    <FormField label="Fecha del evento *">
                      <DatePickerInput value={fechaEvento} onChange={setFechaEvento} className="bg-card" />
                    </FormField>
                    <FormField label="Centro de costo">
                      <Input value={centroCosto} onChange={(e) => setCentroCosto(e.target.value)} placeholder="Ej: CC-001" className="bg-card" />
                    </FormField>
                    <FormField label="Área">
                      <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Ej: Rectorado" className="bg-card" />
                    </FormField>
                    <FormField label="Solicitante">
                      <Input value={solicitante} onChange={(e) => setSolicitante(e.target.value)} placeholder="Nombre" className="bg-card" />
                    </FormField>
                    <FormField label="Cantidad de personas">
                      <Input type="number" value={cantidadPersonas} onChange={(e) => setCantidadPersonas(e.target.value)} placeholder="0" className="bg-card" />
                    </FormField>
                    <FormField label="Total">
                      <Input type="number" value={montoTotal} onChange={(e) => setMontoTotal(e.target.value)} placeholder="0.00" className="bg-card" />
                    </FormField>
                    <FormField label="Número de pedido">
                      <Input value={numeroOrden} onChange={(e) => setNumeroOrden(e.target.value)} placeholder="Ej: PED-0001" className="bg-card" />
                    </FormField>
                  </>
                )}

                {tipoComedor === "bbva" && (
                  <>
                    <FormField label="Fecha del evento *">
                      <DatePickerInput value={fechaEvento} onChange={setFechaEvento} className="bg-card" />
                    </FormField>
                    <FormField label="Solicitante">
                      <Input value={solicitante} onChange={(e) => setSolicitante(e.target.value)} placeholder="Nombre" className="bg-card" />
                    </FormField>
                    <FormField label="Email solicitante">
                      <Input type="email" value={emailSolicitante} onChange={(e) => setEmailSolicitante(e.target.value)} placeholder="correo@bbva.com" className="bg-card" />
                    </FormField>
                    <FormField label="Cantidad de personas">
                      <Input type="number" value={cantidadPersonas} onChange={(e) => setCantidadPersonas(e.target.value)} placeholder="0" className="bg-card" />
                    </FormField>
                    <FormField label="Lugar">
                      <Input value={lugar} onChange={(e) => setLugar(e.target.value)} placeholder="Ej: Sala A" className="bg-card" />
                    </FormField>
                    <FormField label="Total">
                      <Input type="number" value={montoTotal} onChange={(e) => setMontoTotal(e.target.value)} placeholder="0.00" className="bg-card" />
                    </FormField>
                    <FormField label="Medio de pago">
                      <Select value={medioPago} onValueChange={(v) => setMedioPago(v === "__none__" ? "" : v as MedioPago)}>
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
                    <FormField label="Número de operación">
                      <Input value={numeroOperacion} onChange={(e) => setNumeroOperacion(e.target.value)} placeholder="Ej: OP-123456" className="bg-card" />
                    </FormField>
                    <FormField label="Número de orden">
                      <Input value={numeroOrden} onChange={(e) => setNumeroOrden(e.target.value)} placeholder="Ej: ORD-0001" className="bg-card" />
                    </FormField>
                  </>
                )}

                {tipoComedor === "techint" && (
                  <>
                    <FormField label="Fecha del evento *">
                      <DatePickerInput value={fechaEvento} onChange={setFechaEvento} className="bg-card" />
                    </FormField>
                    <FormField label="Número de pedido">
                      <Input value={numeroOrden} onChange={(e) => setNumeroOrden(e.target.value)} placeholder="Ej: PED-0001" className="bg-card" />
                    </FormField>
                    <FormField label="Empresa">
                      <Input value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Razón social" className="bg-card" />
                    </FormField>
                    <FormField label="Concepto">
                      <Input value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Descripción del evento" className="bg-card" />
                    </FormField>
                    <FormField label="Monto">
                      <Input type="number" value={montoTotal} onChange={(e) => setMontoTotal(e.target.value)} placeholder="0.00" className="bg-card" />
                    </FormField>
                    <FormField label="Tipo de factura">
                      <Select value={tipoComprobante} onValueChange={(v) => setTipoComprobante(v === "__none__" ? "" : v)}>
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
                    <FormField label="Número de factura">
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
