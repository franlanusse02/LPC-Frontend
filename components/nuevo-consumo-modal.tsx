"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { Combobox } from "@/components/ui/combobox";
import { Spinner } from "@/components/ui/spinner";
import { Plus, Trash2 } from "lucide-react";
import { getTodayDate } from "@/lib/dateParser";
import { ComedorResponse } from "@/models/dto/comedor/ComedorResponse";
import { PuntoDeVentaResponse } from "@/models/dto/pto-venta/PuntoDeVentaResponse";
import { ConsumidorResponse } from "@/models/dto/consumos/ConsumidorResponse";
import { ProductoResponse } from "@/models/dto/consumos/ProductoResponse";
import { CreateConsumoRequest } from "@/models/dto/consumos/CreateConsumoRequest";

type ProductoLine = {
  key: number;
  productoId: string;
  cantidad: string;
};

const newLine = (key: number): ProductoLine => ({
  key,
  productoId: "",
  cantidad: "1",
});

interface NuevoConsumoModalProps {
  open: boolean;
  onClose: () => void;
  comedores: ComedorResponse[];
  puntosDeVenta: PuntoDeVentaResponse[];
  consumidores: ConsumidorResponse[];
  productos: ProductoResponse[];
  onConfirm: (payload: CreateConsumoRequest) => Promise<void>;
}

export function NuevoConsumoModal({
  open,
  onClose,
  comedores,
  puntosDeVenta,
  consumidores,
  productos,
  onConfirm,
}: NuevoConsumoModalProps) {
  const [fecha, setFecha] = useState(getTodayDate());
  const [comedorId, setComedorId] = useState("");
  const [puntoDeVentaId, setPuntoDeVentaId] = useState("");
  const [consumidorId, setConsumidorId] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [lines, setLines] = useState<ProductoLine[]>([newLine(1)]);
  const [nextLineKey, setNextLineKey] = useState(2);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const comedorOptions = useMemo(
    () =>
      comedores.map((comedor) => ({
        value: String(comedor.id),
        label: comedor.nombre,
      })),
    [comedores],
  );

  const filteredPuntosDeVenta = useMemo(
    () =>
      puntosDeVenta.filter(
        (item) => !comedorId || String(item.comedorId) === comedorId,
      ),
    [comedorId, puntosDeVenta],
  );

  const filteredConsumidores = useMemo(
    () =>
      consumidores.filter(
        (item) => !comedorId || String(item.comedorId) === comedorId,
      ),
    [comedores, comedorId, consumidores],
  );

  const filteredProductos = useMemo(
    () =>
      productos.filter(
        (item) =>
          item.activo && (!comedorId || String(item.comedorId) === comedorId),
      ),
    [comedorId, productos],
  );

  const resetForm = () => {
    setFecha(getTodayDate());
    setComedorId("");
    setPuntoDeVentaId("");
    setConsumidorId("");
    setObservaciones("");
    setLines([newLine(1)]);
    setNextLineKey(2);
    setSaving(false);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const addLine = () => {
    setLines((prev) => [...prev, newLine(nextLineKey)]);
    setNextLineKey((prev) => prev + 1);
  };

  const updateLine = (key: number, field: keyof ProductoLine, value: string) => {
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, [field]: value } : line)),
    );
  };

  const removeLine = (key: number) => {
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((line) => line.key !== key)));
  };

  const handleComedorChange = (value: string) => {
    setComedorId(value);
    setPuntoDeVentaId("");
    setConsumidorId("");
    setLines([newLine(1)]);
    setNextLineKey(2);
    setError(null);
  };

  const buildPayload = (): CreateConsumoRequest | null => {
    if (!comedorId || !puntoDeVentaId || !consumidorId || !fecha) {
      setError("Completá comedor, punto de venta, consumidor y fecha.");
      return null;
    }

    const productosPayload = lines.reduce<Record<number, number>>((acc, line) => {
      const productoId = Number(line.productoId);
      const cantidad = Number(line.cantidad);

      if (productoId > 0 && cantidad > 0) {
        acc[productoId] = cantidad;
      }
      return acc;
    }, {});

    if (Object.keys(productosPayload).length === 0) {
      setError("Ingresá al menos un producto con cantidad mayor a 0.");
      return null;
    }

    return {
      puntoDeVentaId: Number(puntoDeVentaId),
      fecha,
      consumidorId: Number(consumidorId),
      observaciones: observaciones.trim() || undefined,
      productos: productosPayload,
    };
  };

  const handleSubmit = async () => {
    const payload = buildPayload();
    if (!payload) return;

    setSaving(true);
    setError(null);
    try {
      await onConfirm(payload);
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && handleClose()}>
      <DialogContent className="sm:max-w-3xl overflow-hidden border-0 p-0 shadow-xl">
        <div className="h-1.5 w-full bg-primary" />
        <div className="space-y-6 px-6 pb-6 pt-5">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Plus className="h-5 w-5" />
              </span>
              <DialogTitle className="text-lg font-bold text-gray-900">
                Nuevo consumo
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <FormField label="Fecha">
                <Input
                  type="date"
                  value={fecha}
                  onChange={(event) => setFecha(event.target.value)}
                  className="bg-card"
                  max={new Date().toISOString().split("T")[0]}
                />
              </FormField>

              <FormField label="Comedor">
                <Combobox
                  options={comedorOptions}
                  value={comedorId}
                  onChange={handleComedorChange}
                  placeholder="Seleccionar comedor..."
                  searchPlaceholder="Buscar comedor..."
                />
              </FormField>

              <FormField label="Punto de Venta">
                <Combobox
                  options={filteredPuntosDeVenta.map((item) => ({
                    value: String(item.id),
                    label: item.nombre,
                  }))}
                  value={puntoDeVentaId}
                  onChange={setPuntoDeVentaId}
                  placeholder="Seleccionar punto de venta..."
                  searchPlaceholder="Buscar punto de venta..."
                  disabled={!comedorId}
                />
              </FormField>

              <FormField label="Consumidor">
                <Combobox
                  options={filteredConsumidores.map((item) => ({
                    value: String(item.id),
                    label: `${item.nombre} (${item.taxId})`,
                  }))}
                  value={consumidorId}
                  onChange={setConsumidorId}
                  placeholder="Seleccionar consumidor..."
                  searchPlaceholder="Buscar consumidor..."
                  disabled={!comedorId}
                />
              </FormField>

              <FormField label="Observaciones">
                <Input
                  value={observaciones}
                  onChange={(event) => setObservaciones(event.target.value)}
                  placeholder="Opcional"
                  className="bg-card"
                />
              </FormField>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Productos
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLine}
                  disabled={!comedorId}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Agregar producto
                </Button>
              </div>

              <div className="space-y-3">
                {lines.map((line) => {
                  const selectedIds = lines
                    .filter((item) => item.key !== line.key)
                    .map((item) => item.productoId)
                    .filter(Boolean);

                  const availableProductos = filteredProductos.filter(
                    (item) =>
                      !selectedIds.includes(String(item.productoId)) ||
                      String(item.productoId) === line.productoId,
                  );

                  return (
                    <div
                      key={line.key}
                      className="grid grid-cols-[minmax(0,1fr)_110px_40px] gap-2"
                    >
                      <Combobox
                        options={availableProductos.map((item) => ({
                          value: String(item.productoId),
                          label: `${item.nombre} ($${item.precio})`,
                        }))}
                        value={line.productoId}
                        onChange={(value) => updateLine(line.key, "productoId", value)}
                        placeholder="Seleccionar producto..."
                        searchPlaceholder="Buscar producto..."
                        disabled={!comedorId}
                      />
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={line.cantidad}
                        onChange={(event) =>
                          updateLine(line.key, "cantidad", event.target.value)
                        }
                        className="bg-card"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLine(line.key)}
                        disabled={lines.length === 1}
                        className="h-10 w-10 text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <DialogFooter className="flex-row justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={saving}
              className="rounded-lg border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Guardando...
                </>
              ) : (
                "Guardar consumo"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
