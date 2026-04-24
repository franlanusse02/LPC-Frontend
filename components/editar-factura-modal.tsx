
"use client";

import { useEffect, useMemo, useState } from "react";
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
import { FacturaPuntosDistribucionEditor } from "@/components/factura-puntos-distribucion-editor";
import {
  FacturaPuntoDeVentaDistribucionRow,
  facturaDistribucionRecordFromRows,
  facturaDistribucionRowsFromRecord,
  validateFacturaDistribucionRows,
} from "@/lib/facturas";

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
  const [puntoDeVentaProveedor, setPuntoDeVentaProveedor] = useState(String(factura.puntoDeVentaProveedor ?? ""));
  const [puntoDeVentaComedor, setPuntoDeVentaComedor] = useState<FacturaPuntoDeVentaDistribucionRow[]>(
    () => facturaDistribucionRowsFromRecord(factura.puntoDeVentaComedor),
  );
  const [fechaEmision, setFechaEmision] = useState(factura.fechaEmision ?? "");
  const [fechaPago, setFechaPago] = useState(factura.fechaPago ?? "");

  const selectedProveedor = proveedores.find((p) => p.id === Number(proveedorId));
  const selectedComedor = comedores.find((c) => c.id === Number(comedorId));
  const proveedorPuntosDeVenta = selectedProveedor?.puntosDeVenta ?? [];
  const requiresPuntoDeVenta = proveedorPuntosDeVenta.length > 0;
  const comedorPuntosDeVenta = useMemo(
    () => selectedComedor?.puntosDeVenta ?? [],
    [selectedComedor],
  );
  const distributionError = useMemo(
    () => validateFacturaDistribucionRows(puntoDeVentaComedor),
    [puntoDeVentaComedor],
  );
  const canSubmit = proveedorId && comedorId && fechaFactura && monto &&
    (!requiresPuntoDeVenta || puntoDeVentaProveedor) &&
    !distributionError;

  useEffect(() => {
    setProveedorId(String(factura.proveedorId));
    setComedorId(String(factura.comedorId));
    setFechaFactura(factura.fechaFactura);
    setMonto(String(factura.monto));
    setComentarios(factura.comentarios ?? "");
    setPuntoDeVentaProveedor(String(factura.puntoDeVentaProveedor ?? ""));
    setPuntoDeVentaComedor(facturaDistribucionRowsFromRecord(factura.puntoDeVentaComedor));
    setFechaEmision(factura.fechaEmision ?? "");
    setFechaPago(factura.fechaPago ?? "");
  }, [factura, open]);

  const handleConfirm = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await onConfirm(factura.id, {
        proveedorId: Number(proveedorId),
        comedorId: Number(comedorId),
        fechaFactura,
        monto: Number(monto),
        comentarios,
        puntoDeVentaProveedor: puntoDeVentaProveedor ? Number(puntoDeVentaProveedor) : null,
        puntoDeVentaComedor: facturaDistribucionRecordFromRows(puntoDeVentaComedor),
        fechaEmision: fechaEmision || null,
        fechaPago: fechaPago || null,
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
                onChange={(value) => {
                  setProveedorId(value);
                  setPuntoDeVentaProveedor("");
                }}
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
                <select
                  value={puntoDeVentaProveedor}
                  onChange={(e) => setPuntoDeVentaProveedor(e.target.value)}
                  className="h-9 w-full rounded-md border border-gray-200 bg-card px-2 text-sm">
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
              error={distributionError}
            />
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
            <Button onClick={handleConfirm} disabled={loading || !canSubmit}
              className="rounded-lg font-semibold bg-amber-400 hover:bg-amber-500 text-white">
              {loading ? <><Spinner className="mr-2 h-4 w-4" />Guardando...</> : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
