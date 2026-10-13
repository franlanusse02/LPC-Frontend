import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Spinner } from "@/components/ui/spinner";
import type { ConceptoCajaChicaResponse } from "@/domain/dto/caja-chica/ConceptoCajaChica";
import type { CreateMovimientoCajaChicaRequest } from "@/domain/dto/caja-chica/MovimientoCajaChica";
import type { TipoMovimientoCajaChica } from "@/domain/enums/TipoMovimientoCajaChica";

const hoy = () => new Date().toLocaleDateString("en-CA");

type Props = {
  conceptos: ConceptoCajaChicaResponse[];
  // Resolves on success (form resets for the next one); rejects to keep the input.
  onSubmit: (body: CreateMovimientoCajaChicaRequest) => Promise<void>;
  onCancel?: () => void;
  disabled?: boolean;
};

// Shared by the caja detail dialog and the CARGA_DATOS screen.
export function MovimientoCajaChicaForm({ conceptos, onSubmit, onCancel, disabled }: Props) {
  const [tipo, setTipo] = useState<TipoMovimientoCajaChica>("EGRESO");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(hoy);
  const [conceptoId, setConceptoId] = useState("");
  const [detalle, setDetalle] = useState("");
  const [saving, setSaving] = useState(false);

  const activos = conceptos.filter((c) => c.activo);
  const concepto = activos.find((c) => String(c.id) === conceptoId);
  const detalleObligatorio = concepto?.requiereDetalle ?? false;

  const handleSubmit = async () => {
    const montoNum = Number(monto.replace(",", "."));
    if (!(montoNum > 0) || !/^\d+([.,]\d{1,2})?$/.test(monto.trim())) {
      toast.error("Poné un monto mayor a 0, con hasta 2 decimales.");
      return;
    }
    if (!fecha) {
      toast.error("Elegí la fecha.");
      return;
    }
    if (!concepto) {
      toast.error("Elegí un concepto.");
      return;
    }
    if (detalleObligatorio && !detalle.trim()) {
      toast.error(`El concepto "${concepto.nombre}" pide un detalle.`);
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        tipo,
        monto: montoNum,
        fecha,
        conceptoId: concepto.id,
        detalle: detalle.trim() || null,
      });
      setMonto("");
      setConceptoId("");
      setDetalle("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el movimiento.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {(["INGRESO", "EGRESO"] as const).map((t) => (
          <Button
            key={t}
            type="button"
            variant={tipo === t ? "default" : "outline"}
            className={
              tipo === t
                ? t === "INGRESO"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
                : ""
            }
            onClick={() => setTipo(t)}
          >
            {t === "INGRESO" ? "Ingreso" : "Egreso"}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Monto</label>
          <Input
            value={monto}
            onChange={(e) => setMonto(e.target.value.replace(/[^\d.,]/g, ""))}
            placeholder="0,00"
            inputMode="decimal"
            className="font-mono"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Fecha</label>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Concepto</label>
        <Combobox
          options={activos.map((c) => ({ value: String(c.id), label: c.nombre }))}
          value={conceptoId}
          onChange={setConceptoId}
          placeholder="Elegí un concepto"
          className="w-full"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">
          Detalle{" "}
          {detalleObligatorio ? (
            <span className="text-red-600">(obligatorio)</span>
          ) : (
            <span className="text-gray-400">(opcional)</span>
          )}
        </label>
        <textarea
          value={detalle}
          onChange={(e) => setDetalle(e.target.value)}
          rows={3}
          placeholder={detalleObligatorio ? "Describí el movimiento" : ""}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={saving || disabled}>
          {saving ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Guardando...
            </>
          ) : (
            "Guardar"
          )}
        </Button>
      </div>
    </div>
  );
}
