
"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Plus } from "lucide-react";
import { FormField } from "./form-field";
import { Input } from "./ui/input";
import { ProveedorResponse } from "@/models/dto/proveedor/ProveedorResponse";
import { ComedorResponse } from "@/models/dto/comedor/ComedorResponse";
import { CreateFacturaProveedorRequest } from "@/models/dto/compra/CreateFacturaProveedorRequest";

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
  const [puntoDeVenta, setPuntoDeVenta] = useState("");

  const selectedProveedor = proveedores.find((p) => p.id === Number(proveedorId));
  const requiresPuntoDeVenta = selectedProveedor && selectedProveedor.puntosDeVenta.length > 0;
  const canSubmit = proveedorId && comedorId && fechaFactura && numero && monto &&
    (!requiresPuntoDeVenta || puntoDeVenta);

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
        puntoDeVenta: puntoDeVenta ? Number(puntoDeVenta) : null as any,
      });
      onClose();
      setProveedorId(""); setComedorId(""); setFechaFactura("");
      setNumero(""); setMonto(""); setComentarios(""); setPuntoDeVenta("");
    } finally {
      setLoading(false);
    }
  };

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
              <select value={proveedorId} onChange={(e) => { setProveedorId(e.target.value); setPuntoDeVenta(""); }}
                className="h-9 w-full rounded-md border border-gray-200 bg-card px-2 text-sm text-gray-700">
                <option value="">Seleccionar...</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Comedor *">
              <select value={comedorId} onChange={(e) => setComedorId(e.target.value)}
                className="h-9 w-full rounded-md border border-gray-200 bg-card px-2 text-sm text-gray-700">
                <option value="">Seleccionar...</option>
                {comedores.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Número de factura *">
              <Input type="text" value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Ej: 0001-00001234" className="bg-card" />
            </FormField>
            <FormField label="Fecha factura *">
              <Input type="date" value={fechaFactura}
                onChange={(e) => setFechaFactura(e.target.value)} className="bg-card" />
            </FormField>
            <FormField label="Monto *">
              <Input type="number" value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00" className="bg-card" />
            </FormField>
            {requiresPuntoDeVenta && (
              <FormField label="Punto de venta *">
                <select value={puntoDeVenta} onChange={(e) => setPuntoDeVenta(e.target.value)}
                  className="h-9 w-full rounded-md border border-gray-200 bg-card px-2 text-sm text-gray-700">
                  <option value="">Seleccionar...</option>
                  {selectedProveedor.puntosDeVenta.map((pv) => (
                    <option key={pv} value={pv}>{pv}</option>
                  ))}
                </select>
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
