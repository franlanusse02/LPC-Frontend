
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Plus } from "lucide-react";
import { FormField } from "./form-field";
import { DatePickerInput } from "./date-picker-input";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { ProveedorResponse } from "@/models/dto/proveedor/ProveedorResponse";
import { ComedorResponse } from "@/models/dto/comedor/ComedorResponse";
import { CreateFacturaProveedorRequest } from "@/models/dto/compra/CreateFacturaProveedorRequest";
import { MedioPago, MediosPagoDict } from "@/models/enums/MedioPago";
import { FacturaPuntosDistribucionEditor } from "@/components/factura-puntos-distribucion-editor";
import {
  FacturaPuntoDeVentaDistribucionRow,
  facturaDistribucionItemsFromRows,
  syncFacturaDistribucionRowsToMonto,
  validateFacturaDistribucionRows,
} from "@/lib/facturas";

interface NuevaFacturaModalProps {
  open: boolean;
  onClose: () => void;
  proveedores: ProveedorResponse[];
  comedores: ComedorResponse[];
  onConfirm: (req: CreateFacturaProveedorRequest) => Promise<void>;
}

export function NuevaFacturaModal({
  open, onClose, proveedores, comedores, onConfirm,
}: NuevaFacturaModalProps) {
  const [loading, setLoading] = useState(false);
  const [proveedorId, setProveedorId] = useState("");
  const [comedorId, setComedorId] = useState("");
  const [fechaFactura, setFechaFactura] = useState("");
  const [numero, setNumero] = useState("");
  const [monto, setMonto] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [puntoDeVentaProveedor, setPuntoDeVentaProveedor] = useState("");
  const [puntoDeVentaComedor, setPuntoDeVentaComedor] = useState<FacturaPuntoDeVentaDistribucionRow[]>([]);
  const [medioPago, setMedioPago] = useState<MedioPago | "">("");

  const selectedProveedor = proveedores.find((p) => p.id === Number(proveedorId));
  const selectedComedor = comedores.find((c) => c.id === Number(comedorId));
  const proveedorPuntosDeVenta = selectedProveedor?.puntosDeVenta ?? [];
  const requiresPuntoDeVenta = proveedorPuntosDeVenta.length > 0;
  const comedorPuntosDeVenta = useMemo(
    () => selectedComedor?.puntosDeVenta ?? [],
    [selectedComedor],
  );
  const distributionError = useMemo(
    () => validateFacturaDistribucionRows(puntoDeVentaComedor, monto),
    [monto, puntoDeVentaComedor],
  );

  useEffect(() => {
    if (selectedProveedor?.formaDePagoPredeterminada) {
      setMedioPago(selectedProveedor.formaDePagoPredeterminada);
    } else {
      setMedioPago("");
    }
    setPuntoDeVentaProveedor("");
  }, [proveedorId]);

  useEffect(() => {
    setPuntoDeVentaComedor((previousRows) =>
      syncFacturaDistribucionRowsToMonto(previousRows, monto),
    );
  }, [monto]);

  const canSubmit = proveedorId && comedorId && fechaFactura && numero && monto &&
    (!requiresPuntoDeVenta || puntoDeVentaProveedor) &&
    !distributionError;

  const handleConfirm = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await onConfirm({
        proveedorId: Number(proveedorId),
        comedorId: Number(comedorId),
        fechaFactura,
        numero,
        monto: Number(monto),
        comentarios,
        puntoDeVentaProveedor: puntoDeVentaProveedor ? Number(puntoDeVentaProveedor) : null,
        puntoDeVentaComedor: facturaDistribucionItemsFromRows(puntoDeVentaComedor),
        medioPago: medioPago || null,
      });
      onClose();
      setProveedorId(""); setComedorId(""); setFechaFactura("");
      setNumero(""); setMonto(""); setComentarios("");
      setPuntoDeVentaProveedor(""); setPuntoDeVentaComedor([]); setMedioPago("");
    } finally {
      setLoading(false);
    }
  };

  const proveedorOptions = proveedores.map((p) => ({ value: String(p.id), label: p.nombre }));
  const comedorOptions = comedores.map((c) => ({ value: String(c.id), label: c.nombre }));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg shadow-xl border-0 p-0 overflow-hidden">
        <div className="h-1.5 w-full bg-primary" />
        <div className="px-6 pt-5 pb-6 space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Plus className="h-5 w-5" />
              </span>
              <DialogTitle className="text-lg font-bold text-gray-900">
                Nueva factura
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Proveedor *">
              <Combobox
                options={proveedorOptions}
                value={proveedorId}
                onChange={setProveedorId}
                placeholder="Seleccionar proveedor..."
                searchPlaceholder="Buscar proveedor..."
              />
            </FormField>
            <FormField label="Comedor *">
              <Combobox
                options={comedorOptions}
                value={comedorId}
                onChange={(value) => {
                  setComedorId(value);
                  setPuntoDeVentaComedor([]);
                }}
                placeholder="Seleccionar comedor..."
                searchPlaceholder="Buscar comedor..."
              />
            </FormField>
            <FormField label="Número de factura *">
              <Input type="text" value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Ej: 0001-00001234" className="bg-card" />
            </FormField>
            <FormField label="Fecha factura *">
              <DatePickerInput value={fechaFactura}
                onChange={setFechaFactura} className="bg-card" />
            </FormField>
            <FormField label="Monto *">
              <Input type="number" value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00" className="bg-card" />
            </FormField>
            <FormField label="Medio de pago">
              <Select
                value={medioPago}
                onValueChange={(v) => setMedioPago(v === "__none__" ? "" : v as MedioPago)}
              >
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
            {requiresPuntoDeVenta && (
              <FormField label="Punto de venta *">
                <select
                  value={puntoDeVentaProveedor}
                  onChange={(e) => setPuntoDeVentaProveedor(e.target.value)}
                  className="h-9 w-full rounded-md border border-gray-200 bg-card px-2 text-sm text-gray-700">
                  <option value="">Seleccionar...</option>
                  {proveedorPuntosDeVenta.map((pv) => (
                    <option key={pv} value={pv}>{pv}</option>
                  ))}
                </select>
              </FormField>
            )}
            <FacturaPuntosDistribucionEditor
              rows={puntoDeVentaComedor}
              puntosDeVenta={comedorPuntosDeVenta}
              onChange={setPuntoDeVentaComedor}
              facturaMonto={monto}
              error={distributionError}
            />
            <FormField label="Comentarios" className="col-span-2">
              <Input type="text" value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
                placeholder="Opcional" className="bg-card" />
            </FormField>
          </div>

          <DialogFooter className="flex-row justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={loading}
              className="rounded-lg border-gray-200 text-gray-600 hover:bg-gray-50">
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={loading || !canSubmit}
              className="rounded-lg font-semibold">
              {loading ? <><Spinner className="mr-2 h-4 w-4" />Creando...</> : "Crear factura"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
