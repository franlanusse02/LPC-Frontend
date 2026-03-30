
"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Pencil } from "lucide-react";
import { FormField } from "./form-field";
import { DatePickerInput } from "./date-picker-input";
import { Input } from "./ui/input";
import { Combobox } from "@/components/ui/combobox";
import { FacturaProveedorResponse } from "@/models/dto/compra/FacturaProveedorResponse";
import { PatchFacturaProveedorRequest } from "@/models/dto/compra/PatchFacturaProveedorRequest";
import { ProveedorResponse } from "@/models/dto/proveedor/ProveedorResponse";
import { ComedorResponse } from "@/models/dto/comedor/ComedorResponse";

interface EditarFacturaModalProps {
  open: boolean;
  onClose: () => void;
  factura: FacturaProveedorResponse;
  proveedores: ProveedorResponse[];
  comedores: ComedorResponse[];
  onConfirm: (facturaId: number, req: PatchFacturaProveedorRequest) => Promise<void>;
}

export function EditarFacturaModal({
  open, onClose, factura, proveedores, comedores, onConfirm,
}: EditarFacturaModalProps) {
  const [loading, setLoading] = useState(false);
  const [proveedorId, setProveedorId] = useState(String(factura.proveedorId));
  const [comedorId, setComedorId] = useState(String(factura.comedorId));
  const [fechaFactura, setFechaFactura] = useState(factura.fechaFactura);
  const [monto, setMonto] = useState(String(factura.monto));
  const [comentarios, setComentarios] = useState(factura.comentarios ?? "");
  const [puntoDeVenta, setPuntoDeVenta] = useState(String(factura.puntoDeVenta ?? ""));
  const [fechaEmision, setFechaEmision] = useState(factura.fechaEmision ?? "");
  const [fechaPago, setFechaPago] = useState(factura.fechaPago ?? "");

  const selectedProveedor = proveedores.find((p) => p.id === Number(proveedorId));
  const requiresPuntoDeVenta = selectedProveedor && selectedProveedor.puntosDeVenta.length > 0;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(factura.id, {
        proveedorId: Number(proveedorId),
        comedorId: Number(comedorId),
        fechaFactura,
        monto: Number(monto),
        comentarios,
        puntoDeVenta: puntoDeVenta ? Number(puntoDeVenta) : null as any,
        fechaEmision: fechaEmision || null as any,
        fechaPago: fechaPago || null as any,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const proveedorOptions = proveedores.map((p) => ({ value: String(p.id), label: p.nombre }));
  const comedorOptions = comedores.map((c) => ({ value: String(c.id), label: c.nombre }));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg shadow-xl border-0 p-0 overflow-hidden">
        <div className="h-1.5 w-full bg-amber-400" />
        <div className="px-6 pt-5 pb-6 space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                <Pencil className="h-5 w-5" />
              </span>
              <DialogTitle className="text-lg font-bold text-gray-900">
                Editar factura #{factura.numero}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Proveedor *">
              <Combobox
                options={proveedorOptions}
                value={proveedorId}
                onChange={(v) => { setProveedorId(v); setPuntoDeVenta(""); }}
                placeholder="Seleccionar proveedor..."
                searchPlaceholder="Buscar proveedor..."
              />
            </FormField>
            <FormField label="Comedor *">
              <Combobox
                options={comedorOptions}
                value={comedorId}
                onChange={setComedorId}
                placeholder="Seleccionar comedor..."
                searchPlaceholder="Buscar comedor..."
              />
            </FormField>
            <FormField label="Fecha factura *">
              <DatePickerInput value={fechaFactura}
                onChange={setFechaFactura} className="bg-card" />
            </FormField>
            <FormField label="Monto *">
              <Input type="number" value={monto}
                onChange={(e) => setMonto(e.target.value)} className="bg-card" />
            </FormField>
            {requiresPuntoDeVenta && (
              <FormField label="Punto de venta *">
                <select value={puntoDeVenta} onChange={(e) => setPuntoDeVenta(e.target.value)}
                  className="h-9 w-full rounded-md border border-gray-200 bg-card px-2 text-sm">
                  <option value="">Seleccionar...</option>
                  {selectedProveedor.puntosDeVenta.map((pv) => (
                    <option key={pv} value={pv}>{pv}</option>
                  ))}
                </select>
              </FormField>
            )}
            {factura.estado === "PENDIENTE" && (
              <FormField label="Fecha emisión">
                <DatePickerInput value={fechaEmision}
                  onChange={setFechaEmision} className="bg-card" />
              </FormField>
            )}
            {factura.estado === "EMITIDA" && (
              <FormField label="Fecha pago">
                <DatePickerInput value={fechaPago}
                  onChange={setFechaPago} className="bg-card" />
              </FormField>
            )}
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
            <Button onClick={handleConfirm} disabled={loading}
              className="rounded-lg font-semibold bg-amber-400 hover:bg-amber-500 text-white">
              {loading ? <><Spinner className="mr-2 h-4 w-4" />Guardando...</> : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
