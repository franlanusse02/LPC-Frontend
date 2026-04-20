"use client";

import { useEffect, useState } from "react";
import {
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  SlidersHorizontal,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ComedorResponse } from "@/models/dto/comedor/ComedorResponse";
import { CreateComedorRequest } from "@/models/dto/comedor/CreateComedorRequest";
import { apiFetch } from "@/lib/api";
import { ApiError } from "@/models/dto/ApiError";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { SociedadResponse } from "@/models/dto/sociedad/SociedadResponse";
import { Combobox } from "@/components/ui/combobox";

// ── Types ─────────────────────────────────────────────────────────────────────

type SortKey = "id" | "nombre";
type SortDir = "asc" | "desc";

export interface ComedorTableProps {
  comedores: ComedorResponse[];
  sociedades: SociedadResponse[];
  loading: boolean;
  onCreated: (comedor: ComedorResponse) => void;
  onUpdated?: (comedor: ComedorResponse) => void;
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

function NuevoComedorModal({
  open,
  onClose,
  onCreated,
  sociedades,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (comedor: ComedorResponse) => void;
  sociedades: SociedadResponse[];
}) {
  const [nombre, setNombre] = useState("");
  const [sociedadId, setSociedadId] = useState("");
  const [saving, setSaving] = useState(false);
  const [nombreError, setNombreError] = useState<string | null>(null);
  const [sociedadError, setSociedadError] = useState<string | null>(null);
  const { token } = useAuth();

  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    if (!sociedadId && sociedades[0]) {
      setSociedadId(String(sociedades[0].id));
    }
  }, [open, sociedades, sociedadId]);

  const handleClose = () => {
    setNombre("");
    setSociedadId("");
    setNombreError(null);
    setSociedadError(null);
    onClose();
  };

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      setNombreError("El nombre es obligatorio.");
      setSociedadError(null);
      return;
    }
    if (!sociedadId) {
      setNombreError(null);
      setSociedadError("La sociedad es obligatoria.");
      return;
    }
    setSaving(true);
    setNombreError(null);
    setSociedadError(null);
    try {
      const payload: CreateComedorRequest = {
        nombre: nombre.trim(),
        sociedadId: Number(sociedadId),
      };
      const response = await apiFetch<ComedorResponse>(
        "/api/comedores",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        token || "",
      );
      onCreated(response);
      handleClose();
    } catch (err) {
      const description = err instanceof ApiError ? err.message : "Error de red. Intentá de nuevo.";
      if (description.toLowerCase().includes("sociedad")) {
        setSociedadError(description);
      } else if (description.toLowerCase().includes("nombre")) {
        setNombreError(description);
      }
      toast({
        variant: "destructive",
        title: "Error",
        description,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const sociedadOptions = sociedades.map((sociedad) => ({
    value: String(sociedad.id),
    label: sociedad.nombre,
  }));

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
            Nuevo Comedor
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Ingresá el nombre del comedor
          </p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Nombre
            </label>
            <Input
              autoFocus
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                setNombreError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleGuardar()}
              placeholder="Ej: Comedor Central"
              className={cn(
                "h-9 text-sm bg-gray-50 border-gray-200",
                nombreError && "border-red-400 focus-visible:ring-red-300",
              )}
            />
            {nombreError && <p className="text-xs text-red-500">{nombreError}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Sociedad
            </label>
            <Combobox
              options={sociedadOptions}
              value={sociedadId}
              onChange={(value) => {
                setSociedadId(value);
                setSociedadError(null);
              }}
              placeholder="Seleccionar sociedad..."
              searchPlaceholder="Buscar sociedad..."
              emptyText="No se encontraron sociedades."
              disabled={saving || sociedades.length === 0}
              className={cn(sociedadError && "border-red-400 focus-visible:ring-red-300")}
            />
            {sociedadError && <p className="text-xs text-red-500">{sociedadError}</p>}
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

function EditarComedorModal({
  open,
  onClose,
  comedor,
  onUpdated,
  sociedades,
}: {
  open: boolean;
  onClose: () => void;
  comedor: ComedorResponse;
  onUpdated: (comedor: ComedorResponse) => void;
  sociedades: SociedadResponse[];
}) {
  const [nombre, setNombre] = useState(comedor.nombre);
  const [sociedadId, setSociedadId] = useState(String(comedor.sociedadId));
  const [saving, setSaving] = useState(false);
  const [nombreError, setNombreError] = useState<string | null>(null);
  const [sociedadError, setSociedadError] = useState<string | null>(null);
  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setNombre(comedor.nombre);
    setSociedadId(String(comedor.sociedadId));
    setNombreError(null);
    setSociedadError(null);
  }, [open, comedor]);

  const handleClose = () => {
    setNombre(comedor.nombre);
    setSociedadId(String(comedor.sociedadId));
    setNombreError(null);
    setSociedadError(null);
    onClose();
  };

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      setNombreError("El nombre es obligatorio.");
      setSociedadError(null);
      return;
    }
    if (!sociedadId) {
      setNombreError(null);
      setSociedadError("La sociedad es obligatoria.");
      return;
    }
    setSaving(true);
    setNombreError(null);
    setSociedadError(null);
    try {
      const response = await apiFetch<ComedorResponse>(
        `/api/comedores/${comedor.id}`,
        { method: "PATCH", body: JSON.stringify({ nombre: nombre.trim(), sociedadId: Number(sociedadId) }) },
        token || "",
      );
      onUpdated(response);
      onClose();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error de red. Intentá de nuevo.";
      if (msg.toLowerCase().includes("sociedad")) {
        setSociedadError(msg);
      } else if (msg.toLowerCase().includes("nombre")) {
        setNombreError(msg);
      }
      toast({ variant: "destructive", title: "Error", description: msg });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const sociedadOptions = sociedades.map((sociedad) => ({
    value: String(sociedad.id),
    label: sociedad.nombre,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-sm rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="border-b px-6 py-4">
          <h2 className="text-base font-semibold text-gray-800">Editar Comedor</h2>
          <p className="text-xs text-gray-500 mt-0.5">ID #{comedor.id}</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Nombre</label>
            <Input
              autoFocus
              value={nombre}
              onChange={(e) => { setNombre(e.target.value); setNombreError(null); }}
              onKeyDown={(e) => e.key === "Enter" && handleGuardar()}
              placeholder="Ej: Comedor Central"
              className={cn("h-9 text-sm bg-gray-50 border-gray-200", nombreError && "border-red-400 focus-visible:ring-red-300")}
            />
            {nombreError && <p className="text-xs text-red-500">{nombreError}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Sociedad</label>
            <Combobox
              options={sociedadOptions}
              value={sociedadId}
              onChange={(value) => {
                setSociedadId(value);
                setSociedadError(null);
              }}
              placeholder="Seleccionar sociedad..."
              searchPlaceholder="Buscar sociedad..."
              emptyText="No se encontraron sociedades."
              disabled={saving || sociedades.length === 0}
              className={cn(sociedadError && "border-red-400 focus-visible:ring-red-300")}
            />
            {sociedadError && <p className="text-xs text-red-500">{sociedadError}</p>}
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

export function ComedorTable({
  comedores,
  sociedades,
  loading,
  onCreated,
  onUpdated,
  modalOpen,
  setModalOpen,
}: ComedorTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [editTarget, setEditTarget] = useState<ComedorResponse | null>(null);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = [...comedores].sort((a, b) => {
    let av: string | number = sortKey === "id" ? a.id : a.nombre;
    let bv: string | number = sortKey === "id" ? b.id : b.nombre;
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
      <NuevoComedorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={onCreated}
        sociedades={sociedades}
      />

      {editTarget && (
        <EditarComedorModal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          comedor={editTarget}
          sociedades={sociedades}
          onUpdated={(updated) => { onUpdated?.(updated); setEditTarget(null); }}
        />
      )}

      {/* Body */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : comedores.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
          <SlidersHorizontal className="h-8 w-8 opacity-40" />
          <p className="text-sm">No hay comedores registrados</p>
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
                  <th className="px-4 py-3 text-center">Activo</th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((comedor) => (
                  <tr
                    key={comedor.id}
                    className="border-b transition-colors hover:bg-gray-50/80"
                  >
                    <td className="px-4 py-4 font-mono text-gray-500 text-xs">
                      #{comedor.id}
                    </td>
                    <td className="px-4 py-4 font-medium text-gray-800">
                      {comedor.nombre}
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
                        onClick={() => setEditTarget(comedor)}
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
