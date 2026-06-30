import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Combobox } from "@/components/ui/combobox";
import { cn, fmtCurrency } from "@/lib/utils";
import { NuevoItemProveedorModal } from "../components/NuevoItemProveedorModal";
import type { OrdenDeCompraResponse } from "@/domain/dto/orden-compra/OrdenDeCompraResponse";
import type { PatchOrdenDeCompraRequest } from "@/domain/dto/orden-compra/PatchOrdenDeCompraRequest";
import type { ProveedorItemResponse } from "@/domain/dto/proveedor/ProveedorItemResponse";

type ItemLine = { proveedorItemId: string; cantidad: string };

export default function EditarOrdenPage({ basePath = "/contabilidad" }: { basePath?: string }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { get, patch } = useApi();

  const [orden, setOrden] = useState<OrdenDeCompraResponse | null>(null);
  const [items, setItems] = useState<ProveedorItemResponse[]>([]);

  const [fecha, setFecha] = useState("");
  const [fechaEstimadaEntrega, setFechaEstimadaEntrega] = useState("");
  const [solicitante, setSolicitante] = useState("");
  const [plazoEntrega, setPlazoEntrega] = useState("");
  const [condicionEntrega, setCondicionEntrega] = useState("");
  const [tipoFactura, setTipoFactura] = useState("");
  const [descuento, setDescuento] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [lines, setLines] = useState<ItemLine[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    get(`/ordenes-de-compra/${id}`).then((r) => r.json()).then(setOrden);
  }, [id, get]);

  useEffect(() => {
    if (!orden) return;
    setFecha(orden.fecha);
    setFechaEstimadaEntrega(orden.fechaEstimadaEntrega ?? "");
    setSolicitante(orden.solicitante);
    setPlazoEntrega(orden.plazoEntrega ?? "");
    setCondicionEntrega(orden.condicionEntrega ?? "");
    setTipoFactura(orden.tipoFactura ?? "");
    setDescuento(orden.descuento ? String(orden.descuento) : "");
    setObservaciones(orden.observaciones ?? "");
    setLines(orden.items.map((i) => ({ proveedorItemId: String(i.proveedorItemId), cantidad: String(i.cantidad) })));
    get(`/proveedores/${orden.proveedorId}/items`)
      .then((r) => r.json())
      .then((data: ProveedorItemResponse[]) => setItems(Array.isArray(data) ? data : []));
  }, [orden, get]);

  const itemById = useMemo(
    () => Object.fromEntries(items.map((i) => [String(i.id), i])),
    [items],
  );
  const itemOptions = useMemo(
    () =>
      items
        .filter((i) => i.activo)
        .map((i) => ({
          value: String(i.id),
          label: `${i.codigo ? i.codigo + " · " : ""}${i.nombre} — ${fmtCurrency(i.precioUnitario)}`,
        })),
    [items],
  );

  const subtotal = lines.reduce((s, l) => {
    const it = itemById[l.proveedorItemId];
    return s + (it ? it.precioUnitario * (Number(l.cantidad) || 0) : 0);
  }, 0);
  const descuentoNum = Number(descuento) || 0;
  const total = subtotal - descuentoNum;
  const totalNegativo = total < 0;

  const editable = orden?.estado === "PENDIENTE";

  const addLine = () => setLines((p) => [...p, { proveedorItemId: "", cantidad: "" }]);
  const updateLine = (idx: number, field: keyof ItemLine, value: string) =>
    setLines((p) => p.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  const removeLine = (idx: number) => setLines((p) => p.filter((_, i) => i !== idx));
  const onItemCreated = (item: ProveedorItemResponse) => {
    setItems((p) => [...p, item]);
    setLines((p) => [...p, { proveedorItemId: String(item.id), cantidad: "" }]);
  };

  const canSubmit =
    editable &&
    !!fecha &&
    !!solicitante.trim() &&
    lines.length > 0 &&
    lines.every((l) => l.proveedorItemId && Number(l.cantidad) > 0) &&
    !totalNegativo;

  const handleSubmit = async () => {
    if (!id || !canSubmit) return;
    setLoading(true);
    try {
      const req: PatchOrdenDeCompraRequest = {
        fecha,
        fechaEstimadaEntrega: fechaEstimadaEntrega || null,
        solicitante: solicitante.trim(),
        plazoEntrega: plazoEntrega.trim() || null,
        condicionEntrega: condicionEntrega.trim() || null,
        tipoFactura: tipoFactura.trim() || null,
        descuento: descuentoNum,
        observaciones: observaciones.trim() || null,
        items: lines.map((l) => ({ proveedorItemId: Number(l.proveedorItemId), cantidad: Number(l.cantidad) })),
      };
      await patch(`/ordenes-de-compra/${id}`, req);
      toast("Orden actualizada");
      navigate(`${basePath}/compras`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar la orden");
    } finally {
      setLoading(false);
    }
  };

  if (!orden) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <Fragment>
      <div className="mx-auto max-w-4xl px-6 py-6">
        <Button variant="ghost" className="mb-6 gap-2" onClick={() => navigate(`${basePath}/compras`)}>
          <ArrowLeft className="h-4 w-4" /> Volver a compras
        </Button>

        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                <Pencil className="h-5 w-5" />
              </span>
              <CardTitle className="text-xl font-bold uppercase tracking-wide">
                Editar Orden {orden.nroOrden}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            {!editable && (
              <p className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-700">
                Solo se puede editar una orden PENDIENTE. Esta orden está {orden.estado}.
              </p>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Solicitante *">
                <Input value={solicitante} onChange={(e) => setSolicitante(e.target.value)} disabled={!editable} />
              </Field>
              <Field label="Fecha *">
                <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} disabled={!editable} />
              </Field>
              <Field label="Fecha estimada de entrega">
                <Input type="date" value={fechaEstimadaEntrega} onChange={(e) => setFechaEstimadaEntrega(e.target.value)} disabled={!editable} />
              </Field>
              <Field label="Plazo de entrega">
                <Input value={plazoEntrega} onChange={(e) => setPlazoEntrega(e.target.value)} disabled={!editable} placeholder="Ej: 7 días" />
              </Field>
              <Field label="Condición de entrega">
                <Input value={condicionEntrega} onChange={(e) => setCondicionEntrega(e.target.value)} disabled={!editable} placeholder="Ej: Puesto en sucursal" />
              </Field>
              <Field label="Tipo de factura">
                <Input value={tipoFactura} onChange={(e) => setTipoFactura(e.target.value)} disabled={!editable} placeholder="Ej: A" />
              </Field>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Ítems *</label>
                {editable && (
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={addLine} className="gap-1.5 text-xs">
                      <Plus className="h-3.5 w-3.5" /> Agregar ítem
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(true)} className="gap-1.5 text-xs">
                      <Plus className="h-3.5 w-3.5" /> Nuevo artículo
                    </Button>
                  </div>
                )}
              </div>

              {lines.map((line, idx) => {
                const used = lines.filter((_, i) => i !== idx).map((l) => l.proveedorItemId);
                const opts = itemOptions.filter((o) => !used.includes(o.value));
                const it = itemById[line.proveedorItemId];
                const lineTotal = it ? it.precioUnitario * (Number(line.cantidad) || 0) : null;
                return (
                  <div key={idx} className="flex items-end gap-2">
                    <div className="flex-1">
                      <Combobox options={opts} value={line.proveedorItemId} onChange={(v) => updateLine(idx, "proveedorItemId", v)} placeholder="Artículo..." disabled={!editable} />
                    </div>
                    <Input type="number" min="0" value={line.cantidad} onChange={(e) => updateLine(idx, "cantidad", e.target.value)} placeholder="Cant." className="w-24" disabled={!editable} />
                    <span className="w-28 text-right text-sm font-mono text-gray-600">{lineTotal !== null ? fmtCurrency(lineTotal) : "—"}</span>
                    {editable && (
                      <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-red-500" onClick={() => removeLine(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            <Field label="Observaciones">
              <Input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} disabled={!editable} placeholder="Opcional" />
            </Field>

            <div className="flex flex-col items-end gap-1 border-t pt-4 text-sm">
              <div className="flex w-64 justify-between"><span className="text-gray-500">Subtotal</span><span className="font-mono">{fmtCurrency(subtotal)}</span></div>
              <div className="flex w-64 items-center justify-between gap-2">
                <span className="text-gray-500">Descuento</span>
                <Input type="number" min="0" value={descuento} onChange={(e) => setDescuento(e.target.value)} placeholder="0" className="w-32 text-right" disabled={!editable} />
              </div>
              <div className={cn("flex w-64 justify-between border-t pt-1 font-semibold", totalNegativo && "text-red-600")}>
                <span>Total</span><span className="font-mono">{fmtCurrency(total)}</span>
              </div>
              {totalNegativo && <p className="text-xs text-red-600">El descuento no puede superar el subtotal.</p>}
            </div>
          </CardContent>
        </Card>

        {editable && (
          <div className="mt-6 flex justify-center">
            <Button onClick={handleSubmit} disabled={loading || !canSubmit} size="lg" className="px-10 bg-amber-400 hover:bg-amber-500 text-white">
              {loading ? <><Spinner className="mr-2" />Guardando...</> : "Guardar Cambios"}
            </Button>
          </div>
        )}
      </div>

      <NuevoItemProveedorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        proveedorId={orden.proveedorId}
        onCreated={onItemCreated}
      />
    </Fragment>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
