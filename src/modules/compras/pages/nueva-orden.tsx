import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Combobox } from "@/components/ui/combobox";
import { cn, fmtCurrency } from "@/lib/utils";
import { NuevoItemProveedorModal } from "../components/NuevoItemProveedorModal";
import { PlantillasSheet } from "../components/PlantillasSheet";
import { GuardarPlantillaModal, NOMBRE_DUPLICADO } from "../components/GuardarPlantillaModal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ApiError } from "@/lib/api-client";
import { EditarItemProveedorModal } from "@/modules/catalogo/components/EditarItemProveedorModal";
import type { ProveedorResponse } from "@/domain/dto/proveedor/ProveedorResponse";
import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";
import type { SociedadResponse } from "@/domain/dto/sociedad/SociedadResponse";
import type { ProveedorItemResponse } from "@/domain/dto/proveedor/ProveedorItemResponse";
import type { CreateOrdenDeCompraRequest } from "@/domain/dto/orden-compra/CreateOrdenDeCompraRequest";
import type {
  PlantillaOrdenDeCompraItemResponse,
  PlantillaOrdenDeCompraResponse,
} from "@/domain/dto/orden-compra/PlantillaOrdenDeCompraResponse";
import type { SavePlantillaOrdenDeCompraRequest } from "@/domain/dto/orden-compra/SavePlantillaOrdenDeCompraRequest";

type ItemLine = { proveedorItemId: string; cantidad: string };

type Mode =
  | { kind: "orden" }
  | { kind: "plantilla-nueva" }
  | { kind: "plantilla-editar"; id: number; nombre: string };

const todayIso = () => new Date().toISOString().split("T")[0];
const toStr = (v: number | string | null | undefined) => (v == null ? "" : String(v));

export default function NuevaOrdenPage({ basePath = "/encargado" }: { basePath?: string }) {
  const navigate = useNavigate();
  const { get, post, put } = useApi();

  const [proveedores, setProveedores] = useState<ProveedorResponse[]>([]);
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [sociedades, setSociedades] = useState<SociedadResponse[]>([]);
  const [items, setItems] = useState<ProveedorItemResponse[]>([]);

  const [fecha, setFecha] = useState(todayIso);
  const [fechaEstimadaEntrega, setFechaEstimadaEntrega] = useState("");
  const [solicitante, setSolicitante] = useState("");
  const [sociedadId, setSociedadId] = useState("");
  const [comedorId, setComedorId] = useState("");
  const [proveedorId, setProveedorId] = useState("");
  const [plazoEntrega, setPlazoEntrega] = useState("");
  const [condicionEntrega, setCondicionEntrega] = useState("");
  const [tipoFactura, setTipoFactura] = useState("");
  const [descuento, setDescuento] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [lines, setLines] = useState<ItemLine[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<ProveedorItemResponse | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState<Mode>({ kind: "orden" });
  const [plantillaNombre, setPlantillaNombre] = useState("");
  const [nombreError, setNombreError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [plantillas, setPlantillas] = useState<PlantillaOrdenDeCompraResponse[]>([]);
  const [plantillasLoading, setPlantillasLoading] = useState(false);
  const [guardarOpen, setGuardarOpen] = useState(false);
  // Action waiting on the "Se descartará lo cargado" confirm.
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // The proveedorId effect clears lines and refetches items, so a plantilla's lines
  // are parked here and applied once that proveedor's items have loaded.
  const pendingLinesRef = useRef<{ proveedorId: string; items: PlantillaOrdenDeCompraItemResponse[] } | null>(null);
  const loadedProveedorRef = useRef("");

  const isPlantillaMode = mode.kind !== "orden";
  const req = isPlantillaMode ? "" : " *";

  useEffect(() => {
    Promise.all([get("/proveedores"), get("/comedores"), get("/sociedades")]).then(
      ([p, c, s]) => {
        p.json().then(setProveedores);
        c.json().then(setComedores);
        s.json().then(setSociedades);
      },
    );
  }, [get]);

  useEffect(() => {
    loadedProveedorRef.current = "";
    if (!proveedorId) { setItems([]); setLines([]); return; }
    let ignore = false;
    setLines([]);
    get(`/proveedores/${proveedorId}/items`)
      .then((r) => r.json())
      .then((data: ProveedorItemResponse[]) => {
        if (ignore) return;
        const activos = Array.isArray(data) ? data.filter((i) => i.activo) : [];
        setItems(activos);
        loadedProveedorRef.current = proveedorId;
        const pending = pendingLinesRef.current;
        if (pending && pending.proveedorId === proveedorId) {
          pendingLinesRef.current = null;
          applyPlantillaLines(pending.items, activos);
        }
      });
    return () => { ignore = true; };
  }, [proveedorId, get]);

  // Keeps only lines whose item is still active; names the dropped ones.
  function applyPlantillaLines(planItems: PlantillaOrdenDeCompraItemResponse[], activos: ProveedorItemResponse[]) {
    const activeIds = new Set(activos.map((i) => i.id));
    const kept = planItems.filter((i) => i.activo && activeIds.has(i.proveedorItemId));
    const skipped = planItems.filter((i) => !kept.includes(i));
    setLines(kept.map((i) => ({ proveedorItemId: String(i.proveedorItemId), cantidad: String(i.cantidad) })));
    if (skipped.length > 0) {
      toast.warning(
        skipped.length === 1 ? "Se omitió un artículo desactivado" : `Se omitieron ${skipped.length} artículos desactivados`,
        { description: skipped.map((i) => i.nombre).join(", ") },
      );
    }
  }

  const itemById = useMemo(
    () => Object.fromEntries(items.map((i) => [String(i.id), i])),
    [items],
  );

  const itemOptions = useMemo(
    () =>
      items.map((i) => ({
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

  const addLine = () => setLines((p) => [...p, { proveedorItemId: "", cantidad: "" }]);
  const updateLine = (idx: number, field: keyof ItemLine, value: string) =>
    setLines((p) => p.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  const removeLine = (idx: number) => setLines((p) => p.filter((_, i) => i !== idx));

  const onItemCreated = (item: ProveedorItemResponse) => {
    setItems((p) => [...p, item]);
    setLines((p) => [...p, { proveedorItemId: String(item.id), cantidad: "" }]);
  };

  const onItemEdited = (saved: ProveedorItemResponse) =>
    setItems((p) => p.map((i) => (i.id === saved.id ? saved : i)));

  const linesComplete = lines.length > 0 && lines.every((l) => l.proveedorItemId && Number(l.cantidad) > 0);

  const canSubmit =
    !!fecha &&
    !!solicitante.trim() &&
    !!sociedadId &&
    !!comedorId &&
    !!proveedorId &&
    linesComplete &&
    !totalNegativo;

  // A plantilla only needs nombre + proveedor + complete lines.
  const canSavePlantillaFields = !!proveedorId && linesComplete;
  const canSubmitPlantilla = !!plantillaNombre.trim() && canSavePlantillaFields;

  // Fields shared by the orden and the plantilla request.
  const buildCommon = () => ({
    solicitante: solicitante.trim() || null,
    sociedadId: sociedadId ? Number(sociedadId) : null,
    comedorId: comedorId ? Number(comedorId) : null,
    proveedorId: Number(proveedorId),
    plazoEntrega: plazoEntrega.trim() || null,
    condicionEntrega: condicionEntrega.trim() || null,
    tipoFactura: tipoFactura.trim() || null,
    descuento: descuentoNum || null,
    observaciones: observaciones.trim() || null,
    items: lines.map((l) => ({
      proveedorItemId: Number(l.proveedorItemId),
      cantidad: Number(l.cantidad),
    })),
  });

  const buildPlantillaRequest = (nombre: string): SavePlantillaOrdenDeCompraRequest => ({
    ...buildCommon(),
    nombre,
  });

  const isDirty =
    !!solicitante.trim() || !!sociedadId || !!comedorId || !!proveedorId ||
    !!plazoEntrega.trim() || !!condicionEntrega.trim() || !!tipoFactura.trim() ||
    !!descuento || !!observaciones.trim() || !!fechaEstimadaEntrega || lines.length > 0 ||
    (isPlantillaMode && !!plantillaNombre.trim());

  const guard = (action: () => void) => {
    if (isDirty) setPendingAction(() => action);
    else action();
  };

  const resetForm = () => {
    pendingLinesRef.current = null;
    setFecha(todayIso());
    setFechaEstimadaEntrega("");
    setSolicitante("");
    setSociedadId("");
    setComedorId("");
    setProveedorId("");
    setPlazoEntrega("");
    setCondicionEntrega("");
    setTipoFactura("");
    setDescuento("");
    setObservaciones("");
    setLines([]);
    setPlantillaNombre("");
    setNombreError(null);
  };

  const loadPlantilla = (p: PlantillaOrdenDeCompraResponse) => {
    resetForm();
    setSociedadId(toStr(p.sociedadId));
    setComedorId(toStr(p.comedorId));
    setSolicitante(p.solicitante ?? "");
    setPlazoEntrega(p.plazoEntrega ?? "");
    setCondicionEntrega(p.condicionEntrega ?? "");
    setTipoFactura(p.tipoFactura ?? "");
    setDescuento(p.descuento ? String(p.descuento) : "");
    setObservaciones(p.observaciones ?? "");
    const provId = String(p.proveedorId);
    // Overrides resetForm's clear in the same batch, so an unchanged proveedor doesn't rerun the effect.
    setProveedorId(provId);
    if (provId === proveedorId && loadedProveedorRef.current === provId) {
      // Same proveedor already loaded: the effect won't rerun, apply now.
      applyPlantillaLines(p.items, items);
    } else {
      pendingLinesRef.current = { proveedorId: provId, items: p.items };
    }
  };

  // Refetch on every open so creates/edits made in the form show up.
  const openSheet = () => {
    setSheetOpen(true);
    setPlantillasLoading(true);
    get("/ordenes-de-compra/plantillas")
      .then((r) => r.json())
      .then((d: PlantillaOrdenDeCompraResponse[]) => setPlantillas(Array.isArray(d) ? d : []))
      .catch((err) => toast.error(err instanceof Error ? err.message : "No se pudieron cargar las plantillas"))
      .finally(() => setPlantillasLoading(false));
  };

  const handleSelectPlantilla = (p: PlantillaOrdenDeCompraResponse) => {
    setSheetOpen(false);
    guard(() => {
      setMode({ kind: "orden" });
      loadPlantilla(p);
      toast("Plantilla cargada", { description: p.nombre });
    });
  };

  const handleEditPlantilla = (p: PlantillaOrdenDeCompraResponse) => {
    setSheetOpen(false);
    guard(() => {
      setMode({ kind: "plantilla-editar", id: p.id, nombre: p.nombre });
      loadPlantilla(p);
      setPlantillaNombre(p.nombre);
    });
  };

  const handleNuevaPlantilla = () => {
    setSheetOpen(false);
    guard(() => {
      resetForm();
      setMode({ kind: "plantilla-nueva" });
    });
  };

  const handleCancelarPlantilla = () =>
    guard(() => {
      resetForm();
      setMode({ kind: "orden" });
    });

  const handleSubmitPlantilla = async () => {
    if (!canSubmitPlantilla) return;
    setLoading(true);
    setNombreError(null);
    try {
      const req = buildPlantillaRequest(plantillaNombre.trim());
      if (mode.kind === "plantilla-editar") {
        await put(`/ordenes-de-compra/plantillas/${mode.id}`, req);
        toast("Plantilla actualizada", { description: req.nombre });
      } else {
        await post("/ordenes-de-compra/plantillas", req);
        toast("Plantilla creada", { description: req.nombre });
      }
      resetForm();
      setMode({ kind: "orden" });
      openSheet();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setNombreError(NOMBRE_DUPLICADO);
      else toast.error(err instanceof Error ? err.message : "No se pudo guardar la plantilla");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const req: CreateOrdenDeCompraRequest = {
        ...buildCommon(),
        fecha,
        fechaEstimadaEntrega: fechaEstimadaEntrega || null,
        solicitante: solicitante.trim(),
        sociedadId: Number(sociedadId),
        comedorId: Number(comedorId),
      };
      await post("/ordenes-de-compra", req);
      toast("Orden de compra creada");
      navigate(`${basePath}/compras`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo crear la orden");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Fragment>
      <div className="mx-auto max-w-4xl px-6 py-6">
        <Button variant="ghost" className="mb-6 gap-2" onClick={() => navigate(`${basePath}/compras`)}>
          <ArrowLeft className="h-4 w-4" /> Volver a compras
        </Button>

        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-xl font-bold uppercase tracking-wide">
                {isPlantillaMode ? "Plantilla de Orden de Compra" : "Nueva Orden de Compra"}
              </CardTitle>
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={openSheet}>
                <FileText className="h-4 w-4" /> Ver plantillas
              </Button>
            </div>
          </CardHeader>
          {isPlantillaMode && (
            <div className="flex items-center justify-between gap-3 border-b bg-amber-50 px-6 py-3 text-sm text-amber-900">
              <span className="font-medium">
                {mode.kind === "plantilla-editar" ? <>Editando plantilla: <strong>{mode.nombre}</strong></> : "Nueva plantilla"}
              </span>
              <span className="text-xs text-amber-700">Las fechas y los precios no se guardan.</span>
            </div>
          )}
          <CardContent className="p-6 space-y-5">
            {isPlantillaMode && (
              <Field label="Nombre de la plantilla *">
                <Input
                  value={plantillaNombre}
                  onChange={(e) => { setPlantillaNombre(e.target.value); setNombreError(null); }}
                  placeholder="Ej: Pedido semanal verdulería"
                  aria-invalid={!!nombreError}
                  autoFocus
                />
                {nombreError && <p className="text-xs text-red-600">{nombreError}</p>}
              </Field>
            )}
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={`Empresa solicitante${req}`}>
                <Combobox options={sociedades.map((s) => ({ value: String(s.id), label: s.nombre }))} value={sociedadId} onChange={setSociedadId} placeholder="Seleccionar..." className="w-full" />
              </Field>
              <Field label={`Sucursal${req}`}>
                <Combobox options={comedores.map((c) => ({ value: String(c.id), label: c.nombre }))} value={comedorId} onChange={setComedorId} placeholder="Seleccionar..." className="w-full" />
              </Field>
              <Field label="Proveedor *">
                <Combobox options={proveedores.map((p) => ({ value: String(p.id), label: p.nombre }))} value={proveedorId} onChange={setProveedorId} placeholder="Seleccionar..." className="w-full" />
              </Field>
              <Field label={`Solicitante${req}`}>
                <Input value={solicitante} onChange={(e) => setSolicitante(e.target.value)} placeholder="Nombre del solicitante" />
              </Field>
              {!isPlantillaMode && (
                <>
                  <Field label="Fecha *">
                    <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                  </Field>
                  <Field label="Fecha estimada de entrega">
                    <Input type="date" value={fechaEstimadaEntrega} onChange={(e) => setFechaEstimadaEntrega(e.target.value)} />
                  </Field>
                </>
              )}
              <Field label="Plazo de entrega">
                <Input value={plazoEntrega} onChange={(e) => setPlazoEntrega(e.target.value)} placeholder="Ej: 7 días" />
              </Field>
              <Field label="Condición de entrega">
                <Input value={condicionEntrega} onChange={(e) => setCondicionEntrega(e.target.value)} placeholder="Ej: Puesto en sucursal" />
              </Field>
              <Field label="Tipo de factura">
                <Input value={tipoFactura} onChange={(e) => setTipoFactura(e.target.value)} placeholder="Ej: A" />
              </Field>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Ítems *</label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={addLine} disabled={!proveedorId} className="gap-1.5 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Agregar ítem
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(true)} disabled={!proveedorId} className="gap-1.5 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Nuevo artículo
                  </Button>
                </div>
              </div>

              {!proveedorId && <p className="text-xs text-gray-400">Seleccioná un proveedor primero.</p>}

              {proveedorId && lines.length === 0 && (
                <p className="text-xs text-gray-400">Sin ítems. Agregá al menos uno.</p>
              )}

              {lines.map((line, idx) => {
                const used = lines.filter((_, i) => i !== idx).map((l) => l.proveedorItemId);
                const opts = itemOptions.filter((o) => !used.includes(o.value));
                const it = itemById[line.proveedorItemId];
                const lineTotal = it ? it.precioUnitario * (Number(line.cantidad) || 0) : null;
                return (
                  <div key={idx} className="flex items-end gap-2">
                    <div className="flex-1">
                      <Combobox options={opts} value={line.proveedorItemId} onChange={(v) => updateLine(idx, "proveedorItemId", v)} placeholder="Artículo..." />
                    </div>
                    <Input type="number" min="0" value={line.cantidad} onChange={(e) => updateLine(idx, "cantidad", e.target.value)} placeholder="Cant." className="w-24" />
                    <span className="w-28 text-right text-sm font-mono text-gray-600">{lineTotal !== null ? fmtCurrency(lineTotal) : "—"}</span>
                    <Button type="button" variant="ghost" size="icon" disabled={!it} className="h-9 w-9 text-gray-400 hover:text-gray-700" onClick={() => { if (it) { setEditItem(it); setEditOpen(true); } }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-red-500" onClick={() => removeLine(idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>

            <Field label="Observaciones">
              <Input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Opcional" />
            </Field>

            <div className="flex flex-col items-end gap-1 border-t pt-4 text-sm">
              <div className="flex w-64 justify-between"><span className="text-gray-500">Subtotal</span><span className="font-mono">{fmtCurrency(subtotal)}</span></div>
              <div className="flex w-64 items-center justify-between gap-2">
                <span className="text-gray-500">Descuento</span>
                <Input type="number" min="0" value={descuento} onChange={(e) => setDescuento(e.target.value)} placeholder="0" className="w-32 text-right" />
              </div>
              <div className={cn("flex w-64 justify-between border-t pt-1 font-semibold", totalNegativo && "text-red-600")}>
                <span>Total</span><span className="font-mono">{fmtCurrency(total)}</span>
              </div>
              {totalNegativo && <p className="text-xs text-red-600">El descuento no puede superar el subtotal.</p>}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {isPlantillaMode ? (
            <>
              <Button variant="outline" size="lg" onClick={handleCancelarPlantilla} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleSubmitPlantilla} disabled={loading || !canSubmitPlantilla} size="lg" className="px-10">
                {loading ? <><Spinner className="mr-2" />Guardando...</> : "Guardar plantilla"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="lg" className="gap-1.5" onClick={() => setGuardarOpen(true)} disabled={loading || !canSavePlantillaFields}>
                <Save className="h-4 w-4" /> Guardar como plantilla
              </Button>
              <Button onClick={handleSubmit} disabled={loading || !canSubmit} size="lg" className="px-10">
                {loading ? <><Spinner className="mr-2" />Guardando...</> : "Crear Orden"}
              </Button>
            </>
          )}
        </div>
      </div>

      {proveedorId && (
        <NuevoItemProveedorModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          proveedorId={Number(proveedorId)}
          onCreated={onItemCreated}
        />
      )}

      <EditarItemProveedorModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        item={editItem}
        onSaved={onItemEdited}
      />

      <PlantillasSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        plantillas={plantillas}
        loading={plantillasLoading}
        onDeleted={(id) => setPlantillas((p) => p.filter((x) => x.id !== id))}
        onSelect={handleSelectPlantilla}
        onEdit={handleEditPlantilla}
        onNueva={handleNuevaPlantilla}
      />

      <GuardarPlantillaModal
        open={guardarOpen}
        onClose={() => setGuardarOpen(false)}
        buildRequest={buildPlantillaRequest}
      />

      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(o) => !o && setPendingAction(null)}
        title="Descartar cambios"
        description="Se descartará lo cargado en el formulario."
        confirmLabel="Descartar"
        onConfirm={() => pendingAction?.()}
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
