"use client";

import { useState } from "react";
import {
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  SlidersHorizontal,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PuntoDeVentaResponse } from "@/models/dto/pto-venta/PuntoDeVentaResponse";
import { ComedorResponse } from "@/models/dto/comedor/ComedorResponse";
import { apiFetch } from "@/lib/api";
import { ApiError } from "@/models/dto/ApiError";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";

// ── Types ─────────────────────────────────────────────────────────────────────

type SortKey = "id" | "nombre" | "comedorId";
type SortDir = "asc" | "desc";

export interface PuntoDeVentaTableProps {
  puntosDeVenta: PuntoDeVentaResponse[];
  comedores: ComedorResponse[];
  loading: boolean;
  onCreated: (punto: PuntoDeVentaResponse) => void;
  onUpdated?: (punto: PuntoDeVentaResponse) => void;
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function SortIcon({
  col,
  sortKey,
  sortDir,
}: {
  col: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
}) {
  if (col !== sortKey)
    return <ChevronsUpDown className="ml-1 inline h-3 w-3 opacity-30" />;
  return sortDir === "asc" ? (
    <ChevronUp className="ml-1 inline h-3 w-3 text-primary" />
  ) : (
    <ChevronDown className="ml-1 inline h-3 w-3 text-primary" />
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function NuevoPuntoDeVentaModal({
  open,
  onClose,
  onCreated,
  comedores,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (punto: PuntoDeVentaResponse) => void;
  comedores: ComedorResponse[];
}) {
  const [nombre, setNombre] = useState("");
  const [comedorId, setComedorId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ nombre?: string; comedorId?: string }>(
    {},
  );
  const { token } = useAuth();
  const { toast } = useToast();

  const handleClose = () => {
    setNombre("");
    setComedorId("");
    setErrors({});
    onClose();
  };

  const validate = () => {
    const next: typeof errors = {};
    if (!nombre.trim()) next.nombre = "El nombre es obligatorio.";
    if (!comedorId) next.comedorId = "Seleccioná un comedor.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleGuardar = async () => {
    if (!validate()) return;
    setSaving(true);
    setErrors({});
    try {
      const response = await apiFetch<PuntoDeVentaResponse>(
        "/api/puntodeventa",
        {
          method: "POST",
          body: JSON.stringify({
            nombre: nombre.trim(),
            comedorId: Number(comedorId),
          }),
        },
        token || "",
      );
      onCreated(response);
      handleClose();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Error de red. Intentá de nuevo.";
      toast({ variant: "destructive", title: "Error", description: msg });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={handleClose}
      />
      {/* Dialog */}
      <div className="relative z-10 w-full max-w-sm rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="border-b px-6 py-4">
          <h2 className="text-base font-semibold text-gray-800">
            Nuevo Punto de Venta
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Completá los datos del punto de venta
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Nombre
            </label>
            <Input
              autoFocus
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                setErrors((prev) => ({ ...prev, nombre: undefined }));
              }}
              onKeyDown={(e) => e.key === "Enter" && handleGuardar()}
              placeholder="Ej: Punto Central"
              className={cn(
                "h-9 text-sm bg-gray-50 border-gray-200",
                errors.nombre && "border-red-400 focus-visible:ring-red-300",
              )}
            />
            {errors.nombre && (
              <p className="text-xs text-red-500">{errors.nombre}</p>
            )}
          </div>

          {/* Comedor */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Comedor
            </label>
            <Select
              value={comedorId}
              onValueChange={(val) => {
                setComedorId(val);
                setErrors((prev) => ({ ...prev, comedorId: undefined }));
              }}
            >
              <SelectTrigger
                className={cn(
                  "h-9 text-sm bg-gray-50 border-gray-200",
                  errors.comedorId &&
                    "border-red-400 focus-visible:ring-red-300",
                )}
              >
                <SelectValue placeholder="Seleccioná un comedor" />
              </SelectTrigger>
              <SelectContent>
                {comedores.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.comedorId && (
              <p className="text-xs text-red-500">{errors.comedorId}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={saving}
            className="border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleGuardar}
            disabled={saving}
            className="gap-1.5"
          >
            {saving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : null}
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditarPuntoDeVentaModal({
  open,
  onClose,
  punto,
  comedores,
  onUpdated,
}: {
  open: boolean;
  onClose: () => void;
  punto: PuntoDeVentaResponse;
  comedores: ComedorResponse[];
  onUpdated: (punto: PuntoDeVentaResponse) => void;
}) {
  const [nombre, setNombre] = useState(punto.nombre);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const { toast } = useToast();

  const handleClose = () => {
    setNombre(punto.nombre);
    setError(null);
    onClose();
  };

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await apiFetch<PuntoDeVentaResponse>(
        `/api/puntodeventa/${punto.id}`,
        { method: "PATCH", body: JSON.stringify({ nombre: nombre.trim() }) },
        token || "",
      );
      onUpdated(response);
      onClose();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error de red. Intentá de nuevo.";
      setError(msg);
      toast({ variant: "destructive", title: "Error", description: msg });
    } finally {
      setSaving(false);
    }
  };

  const comedorNombre = comedores.find((c) => c.id === punto.comedorId)?.nombre ?? `ID ${punto.comedorId}`;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-sm rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="border-b px-6 py-4">
          <h2 className="text-base font-semibold text-gray-800">Editar Punto de Venta</h2>
          <p className="text-xs text-gray-500 mt-0.5">Comedor: {comedorNombre}</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Nombre</label>
            <Input
              autoFocus
              value={nombre}
              onChange={(e) => { setNombre(e.target.value); setError(null); }}
              onKeyDown={(e) => e.key === "Enter" && handleGuardar()}
              placeholder="Ej: Punto Central"
              className={cn("h-9 text-sm bg-gray-50 border-gray-200", error && "border-red-400 focus-visible:ring-red-300")}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <Button variant="outline" size="sm" onClick={handleClose} disabled={saving} className="border-gray-200 text-gray-600 hover:bg-gray-50">
            Cancelar
          </Button>
          <Button size="sm" onClick={handleGuardar} disabled={saving} className="gap-1.5">
            {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : null}
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PuntoDeVentaTable({
  puntosDeVenta,
  comedores,
  loading,
  onCreated,
  onUpdated,
  modalOpen,
  setModalOpen,
}: PuntoDeVentaTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [editTarget, setEditTarget] = useState<PuntoDeVentaResponse | null>(null);

  const comedorMap = new Map(comedores.map((c) => [c.id, c.nombre]));

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = [...puntosDeVenta].sort((a, b) => {
    let av: string | number =
      sortKey === "id" ? a.id : sortKey === "nombre" ? a.nombre : a.comedorId;
    let bv: string | number =
      sortKey === "id" ? b.id : sortKey === "nombre" ? b.nombre : b.comedorId;
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const sortableTh = (label: string, key: SortKey, className?: string) => (
    <th
      className={cn(
        "px-4 py-3 cursor-pointer select-none whitespace-nowrap hover:text-gray-700 transition-colors",
        className,
      )}
      onClick={() => handleSort(key)}
    >
      {label}
      <SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
    </th>
  );

  return (
    <>
      <NuevoPuntoDeVentaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={onCreated}
        comedores={comedores}
      />

      {editTarget && (
        <EditarPuntoDeVentaModal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          punto={editTarget}
          comedores={comedores}
          onUpdated={(updated) => { onUpdated?.(updated); setEditTarget(null); }}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : puntosDeVenta.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
          <SlidersHorizontal className="h-8 w-8 opacity-40" />
          <p className="text-sm">No hay puntos de venta registrados</p>
        </div>
      ) : (
        <>
          {/* Result count */}
          <div className="px-6 py-2 border-b bg-gray-50/60">
            <p className="text-xs text-gray-400">
              {sorted.length} resultado{sorted.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100/80 text-left text-xs uppercase text-gray-500 tracking-wider">
                  {sortableTh("ID", "id", "w-20")}
                  {sortableTh("Nombre", "nombre")}
                  {sortableTh("Comedor", "comedorId")}
                  <th className="px-4 py-3 text-center">Activo</th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((punto) => (
                  <tr
                    key={punto.id}
                    className="border-b transition-colors hover:bg-gray-50/80"
                  >
                    <td className="px-4 py-4 font-mono text-gray-500 text-xs">
                      #{punto.id}
                    </td>
                    <td className="px-4 py-4 font-medium text-gray-800">
                      {punto.nombre}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {comedorMap.get(punto.comedorId) ?? (
                        <span className="text-gray-400 italic">
                          ID {punto.comedorId}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        Activo
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditTarget(punto)}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
