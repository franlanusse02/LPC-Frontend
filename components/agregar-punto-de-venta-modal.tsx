
"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Plus, X } from "lucide-react";
import { FormField } from "./form-field";
import { Input } from "./ui/input";
import { AgregarPuntoDeVentaRequest } from "@/models/dto/proveedor/AgregarPuntoDeVentaRequest";

interface AgregarPuntoDeVentaModalProps {
  open: boolean;
  onClose: () => void;
  proveedorId: number;
  proveedorNombre: string;
  onConfirm: (proveedorId: number, req: AgregarPuntoDeVentaRequest) => Promise<void>;
}

export function AgregarPuntoDeVentaModal({
  open, onClose, proveedorId, proveedorNombre, onConfirm,
}: AgregarPuntoDeVentaModalProps) {
  const [loading, setLoading] = useState(false);
  const [puntosDeVenta, setPuntosDeVenta] = useState<number[]>([]);
  const [pvInput, setPvInput] = useState("");

  const addPuntoDeVenta = () => {
    const val = Number(pvInput.trim());
    if (!pvInput.trim() || isNaN(val) || puntosDeVenta.includes(val)) return;
    setPuntosDeVenta((prev) => [...prev, val]);
    setPvInput("");
  };

  const removePuntoDeVenta = (pv: number) =>
    setPuntosDeVenta((prev) => prev.filter((v) => v !== pv));

  const handleConfirm = async () => {
    if (puntosDeVenta.length === 0) return;
    setLoading(true);
    try {
      await onConfirm(proveedorId, { puntosDeVenta });
      onClose();
      setPuntosDeVenta([]); setPvInput("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md shadow-xl border-0 p-0 overflow-hidden">
        <div className="h-1.5 w-full bg-primary" />
        <div className="px-6 pt-5 pb-6 space-y-4">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Plus className="h-5 w-5" />
              </span>
              <DialogTitle className="text-lg font-bold text-gray-900">
                Agregar puntos de venta
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-gray-500">
              Agregando a <strong className="text-gray-700">{proveedorNombre}</strong>.
            </DialogDescription>
          </DialogHeader>

          <FormField label="Puntos de venta *">
            <div className="flex gap-2">
              <Input type="number" value={pvInput} onChange={(e) => setPvInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPuntoDeVenta()}
                placeholder="Número" className="bg-card" />
              <Button type="button" variant="outline" onClick={addPuntoDeVenta}
                className="shrink-0 border-gray-200">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {puntosDeVenta.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {puntosDeVenta.map((pv) => (
                  <span key={pv}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                    {pv}
                    <button onClick={() => removePuntoDeVenta(pv)} className="text-gray-400 hover:text-gray-600">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </FormField>

          <DialogFooter className="flex-row justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={loading}
              className="rounded-lg border-gray-200 text-gray-600 hover:bg-gray-50">
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={loading || puntosDeVenta.length === 0}
              className="rounded-lg font-semibold">
              {loading ? <><Spinner className="mr-2 h-4 w-4" />Guardando...</> : "Agregar"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
