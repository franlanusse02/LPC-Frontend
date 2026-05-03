"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Pencil,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { ApiError } from "@/models/dto/ApiError";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Combobox } from "@/components/ui/combobox";
import { ComedorResponse } from "@/models/dto/comedor/ComedorResponse";
import { ConsumidorResponse } from "@/models/dto/consumos/ConsumidorResponse";
import { CreateConsumidorRequest } from "@/models/dto/consumos/CreateConsumidorRequest";
import { PatchConsumidorRequest } from "@/models/dto/consumos/PatchConsumidorRequest";

type SortKey = "id" | "nombre" | "comedorId" | "taxId";
type SortDir = "asc" | "desc";

export interface ConsumidoresTableProps {
  consumidores: ConsumidorResponse[];
  comedores: ComedorResponse[];
  loading: boolean;
  onCreated: (consumidor: ConsumidorResponse) => void;
  onUpdated: (consumidor: ConsumidorResponse) => void;
  onDeleted: (consumidorId: number) => void;
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
}

function SortIcon({
  col,
  sortKey,
  sortDir,
}: {
  col: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
}) {
  if (col !== sortKey) {
    return <ChevronsUpDown className="ml-1 inline h-3 w-3 opacity-30" />;
  }

  return sortDir === "asc" ? (
    <ChevronUp className="ml-1 inline h-3 w-3 text-primary" />
  ) : (
    <ChevronDown className="ml-1 inline h-3 w-3 text-primary" />
  );
}

function ConsumidorModal({
  open,
  onClose,
  comedores,
  onSubmit,
  title,
  description,
  submitLabel,
  initialConsumidor,
}: {
  open: boolean;
  onClose: () => void;
  comedores: ComedorResponse[];
  onSubmit: (
    consumidorId: number | null,
    payload: CreateConsumidorRequest | PatchConsumidorRequest,
  ) => Promise<void>;
  title: string;
  description: string;
  submitLabel: string;
  initialConsumidor?: ConsumidorResponse | null;
}) {
  const [nombre, setNombre] = useState(initialConsumidor?.nombre ?? "");
  const [comedorId, setComedorId] = useState(
    initialConsumidor ? String(initialConsumidor.comedorId) : "",
  );
  const [taxId, setTaxId] = useState(
    initialConsumidor?.taxId != null ? String(initialConsumidor.taxId) : "",
  );
  const [posicion, setPosicion] = useState(initialConsumidor?.posicion ?? "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{
    nombre?: string;
    comedorId?: string;
    taxId?: string;
  }>({});

  useEffect(() => {
    if (!open) return;
    setNombre(initialConsumidor?.nombre ?? "");
    setComedorId(initialConsumidor ? String(initialConsumidor.comedorId) : "");
    setTaxId(initialConsumidor?.taxId != null ? String(initialConsumidor.taxId) : "");
    setPosicion(initialConsumidor?.posicion ?? "");
    setErrors({});
  }, [initialConsumidor, open]);

  const reset = () => {
    setNombre(initialConsumidor?.nombre ?? "");
    setComedorId(initialConsumidor ? String(initialConsumidor.comedorId) : "");
    setTaxId(initialConsumidor?.taxId != null ? String(initialConsumidor.taxId) : "");
    setPosicion(initialConsumidor?.posicion ?? "");
    setErrors({});
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const validate = () => {
    const next: typeof errors = {};
    if (!nombre.trim()) {
      next.nombre = "El nombre es obligatorio.";
    }
    if (!comedorId) {
      next.comedorId = "Seleccioná un comedor.";
    }
    // taxId is optional — no required validation
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setSaving(true);
    try {
      await onSubmit(initialConsumidor?.id ?? null, {
        nombre: nombre.trim(),
        comedorId: Number(comedorId),
        taxId: taxId.trim() ? Number(taxId) : null,
        posicion: posicion.trim() || undefined,
      });
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative z-10 w-full max-w-sm rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="border-b px-6 py-4">
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Nombre
            </label>
            <Input
              autoFocus
              value={nombre}
              onChange={(event) => {
                setNombre(event.target.value);
                setErrors((prev) => ({ ...prev, nombre: undefined }));
              }}
              placeholder="Ej: Juan Perez"
              className={cn(
                "h-9 bg-gray-50 text-sm border-gray-200",
                errors.nombre && "border-red-400 focus-visible:ring-red-300",
              )}
            />
            {errors.nombre && (
              <p className="text-xs text-red-500">{errors.nombre}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Comedor
            </label>
            <Combobox
              options={comedores.map((comedor) => ({
                value: String(comedor.id),
                label: comedor.nombre,
              }))}
              value={comedorId}
              onChange={(value) => {
                setComedorId(value);
                setErrors((prev) => ({ ...prev, comedorId: undefined }));
              }}
              placeholder="Seleccionar comedor..."
              searchPlaceholder="Buscar comedor..."
              className={cn(
                errors.comedorId && "border-red-400 focus-visible:ring-red-300",
              )}
            />
            {errors.comedorId && (
              <p className="text-xs text-red-500">{errors.comedorId}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
              DNI (opcional)
            </label>
            <Input
              value={taxId}
              onChange={(event) => {
                setTaxId(event.target.value.replace(/\D/g, ""));
                setErrors((prev) => ({ ...prev, taxId: undefined }));
              }}
              placeholder="20123456789"
              className={cn(
                "h-9 bg-gray-50 text-sm border-gray-200",
                errors.taxId && "border-red-400 focus-visible:ring-red-300",
              )}
            />
            {errors.taxId && (
              <p className="text-xs text-red-500">{errors.taxId}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Posición
            </label>
            <Input
              value={posicion}
              onChange={(event) => setPosicion(event.target.value)}
              placeholder="Ej: Analista"
              className="h-9 bg-gray-50 text-sm border-gray-200"
            />
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
          <Button size="sm" onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : null}
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DeleteConsumidorModal({
  consumidor,
  onClose,
  onConfirm,
}: {
  consumidor: ConsumidorResponse | null;
  onClose: () => void;
  onConfirm: (consumidor: ConsumidorResponse) => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!consumidor) {
      setDeleting(false);
    }
  }, [consumidor]);

  if (!consumidor) return null;

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm(consumidor);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={deleting ? undefined : onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="border-b px-6 py-4">
          <h2 className="text-base font-semibold text-gray-800">
            Eliminar consumidor
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Esta eliminacion es permanente desde la interfaz.
          </p>
        </div>
        <div className="space-y-3 px-6 py-5">
          <p className="text-sm text-gray-700">
            Vas a eliminar a{" "}
            <span className="font-semibold text-gray-900">
              {consumidor.nombre}
            </span>
            . Despues de confirmar, dejara de aparecer en consumidores y no
            podra usarse para nuevos consumos.
          </p>
          <p className="text-sm text-red-600">
            Esta accion no se puede deshacer desde esta pantalla.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={deleting}
            className="border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : null}
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ConsumidoresTable({
  consumidores,
  comedores,
  loading,
  onCreated,
  onUpdated,
  onDeleted,
  modalOpen,
  setModalOpen,
}: ConsumidoresTableProps) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("nombre");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [editTarget, setEditTarget] = useState<ConsumidorResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ConsumidorResponse | null>(
    null,
  );
  const comedorNameById = useMemo(
    () => Object.fromEntries(comedores.map((item) => [item.id, item.nombre])),
    [comedores],
  );

  const displayed = useMemo(() => {
    const query = search.trim().toLowerCase();
    const next = consumidores.filter((consumidor) => {
      if (!consumidor.activo) return false;
      if (!query) return true;
      return (
        consumidor.nombre.toLowerCase().includes(query) ||
        String(consumidor.taxId ?? "").includes(query) ||
        (consumidor.posicion ?? "").toLowerCase().includes(query) ||
        (comedorNameById[consumidor.comedorId] ?? "")
          .toLowerCase()
          .includes(query)
      );
    });

    next.sort((left, right) => {
      let leftValue: string | number = "";
      let rightValue: string | number = "";

      if (sortKey === "id") {
        leftValue = left.id;
        rightValue = right.id;
      }
      if (sortKey === "nombre") {
        leftValue = left.nombre;
        rightValue = right.nombre;
      }
      if (sortKey === "comedorId") {
        leftValue = comedorNameById[left.comedorId] ?? "";
        rightValue = comedorNameById[right.comedorId] ?? "";
      }
      if (sortKey === "taxId") {
        leftValue = left.taxId ?? 0;
        rightValue = right.taxId ?? 0;
      }

      if (leftValue < rightValue) return sortDir === "asc" ? -1 : 1;
      if (leftValue > rightValue) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return next;
  }, [comedores, comedorNameById, consumidores, search, sortDir, sortKey]);

  const activeCount = useMemo(
    () => consumidores.filter((consumidor) => consumidor.activo).length,
    [consumidores],
  );

  const sortableTh = (label: string, key: SortKey, className?: string) => (
    <th
      className={cn(
        "cursor-pointer select-none whitespace-nowrap px-4 py-3 transition-colors hover:text-gray-700",
        className,
      )}
      onClick={() => {
        if (key === sortKey) {
          setSortDir((current) => (current === "asc" ? "desc" : "asc"));
        } else {
          setSortKey(key);
          setSortDir("asc");
        }
      }}
    >
      {label}
      <SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
    </th>
  );

  const handleCreate = async (
    _consumidorId: number | null,
    payload: CreateConsumidorRequest | PatchConsumidorRequest,
  ) => {
    try {
      const created = await apiFetch<ConsumidorResponse>(
        "/api/consumos/consumidores",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        token || "",
      );
      onCreated(created);
      toast({ title: "Consumidor creado" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof ApiError
            ? error.message
            : "No se pudo crear el consumidor.",
      });
      throw error;
    }
  };

  const handleUpdate = async (
    consumidorId: number | null,
    payload: CreateConsumidorRequest | PatchConsumidorRequest,
  ) => {
    if (consumidorId === null) return;

    try {
      const updated = await apiFetch<ConsumidorResponse>(
        `/api/consumos/consumidores/${consumidorId}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
        token || "",
      );
      onUpdated(updated);
      toast({ title: "Consumidor actualizado" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof ApiError
            ? error.message
            : "No se pudo actualizar el consumidor.",
      });
      throw error;
    }
  };

  const handleDelete = async (consumidor: ConsumidorResponse) => {
    try {
      await apiFetch<void>(
        `/api/consumos/consumidores/${consumidor.id}`,
        {
          method: "DELETE",
        },
        token || "",
      );
      onDeleted(consumidor.id);
      toast({ title: "Consumidor eliminado" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof ApiError
            ? error.message
            : "No se pudo eliminar el consumidor.",
      });
      throw error;
    }
  };

  return (
    <>
      <ConsumidorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        comedores={comedores}
        onSubmit={handleCreate}
        title="Nuevo consumidor"
        description="Completá los datos del consumidor"
        submitLabel="Guardar"
      />

      <ConsumidorModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        comedores={comedores}
        onSubmit={handleUpdate}
        title="Editar consumidor"
        description="Actualizá el comedor o los datos personales"
        submitLabel="Guardar cambios"
        initialConsumidor={editTarget}
      />

      <DeleteConsumidorModal
        consumidor={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <div className="border-b px-6 py-4">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar consumidor, DNI o comedor..."
            className="h-8 bg-gray-50 pl-8 text-sm border-gray-200"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
          <SlidersHorizontal className="h-8 w-8 opacity-40" />
          <p className="text-sm">
            {activeCount === 0
              ? "No hay consumidores registrados"
              : "Ningún consumidor coincide con la búsqueda"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100/80 text-left text-xs uppercase tracking-wider text-gray-500">
                {sortableTh("ID", "id", "w-20")}
                {sortableTh("Nombre", "nombre")}
                {sortableTh("Comedor", "comedorId")}
                {sortableTh("DNI", "taxId")}
                <th className="px-4 py-3">Posición</th>
                <th className="w-20 px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((consumidor) => (
                <tr key={consumidor.id} className="border-b transition-colors hover:bg-gray-50/80">
                  <td className="px-4 py-4 font-medium">{consumidor.id}</td>
                  <td className="px-4 py-4">{consumidor.nombre}</td>
                  <td className="px-4 py-4">
                    {comedorNameById[consumidor.comedorId] ?? consumidor.comedorId}
                  </td>
                  <td className="px-4 py-4">{consumidor.taxId ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-4">{consumidor.posicion ?? "—"}</td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditTarget(consumidor)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(consumidor)}
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        title="Eliminar consumidor"
                        aria-label={`Eliminar consumidor ${consumidor.nombre}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
