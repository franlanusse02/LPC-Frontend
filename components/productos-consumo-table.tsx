"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Pencil,
  Power,
  Search,
  SlidersHorizontal,
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
import { CreateProductoRequest } from "@/models/dto/consumos/CreateProductoRequest";
import { PatchProductoRequest } from "@/models/dto/consumos/PatchProductoRequest";
import { ProductoResponse } from "@/models/dto/consumos/ProductoResponse";

type SortKey = "productoId" | "nombre" | "comedorId" | "precio";
type SortDir = "asc" | "desc";

export interface ProductosConsumoTableProps {
  productos: ProductoResponse[];
  comedores: ComedorResponse[];
  loading: boolean;
  onCreated: (producto: ProductoResponse) => void;
  onUpdated: (producto: ProductoResponse) => void;
  onDeleted: (productoId: number) => void;
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

function ProductoModal({
  open,
  onClose,
  comedores,
  onSubmit,
  title,
  description,
  submitLabel,
  initialProducto,
}: {
  open: boolean;
  onClose: () => void;
  comedores: ComedorResponse[];
  onSubmit: (
    productoId: number | null,
    payload: CreateProductoRequest | PatchProductoRequest,
  ) => Promise<void>;
  title: string;
  description: string;
  submitLabel: string;
  initialProducto?: ProductoResponse | null;
}) {
  const [nombre, setNombre] = useState(initialProducto?.nombre ?? "");
  const [comedorId, setComedorId] = useState(
    initialProducto ? String(initialProducto.comedorId) : "",
  );
  const [precio, setPrecio] = useState(
    initialProducto ? String(initialProducto.precio) : "",
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{
    nombre?: string;
    comedorId?: string;
    precio?: string;
  }>({});

  useEffect(() => {
    if (!open) return;
    setNombre(initialProducto?.nombre ?? "");
    setComedorId(initialProducto ? String(initialProducto.comedorId) : "");
    setPrecio(initialProducto ? String(initialProducto.precio) : "");
    setErrors({});
  }, [initialProducto, open]);

  const reset = () => {
    setNombre(initialProducto?.nombre ?? "");
    setComedorId(initialProducto ? String(initialProducto.comedorId) : "");
    setPrecio(initialProducto ? String(initialProducto.precio) : "");
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
    if (!precio || Number(precio) <= 0) {
      next.precio = "Ingresá un precio mayor a 0.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        comedorId: Number(comedorId),
        precio: Number(precio),
      };
      await onSubmit(initialProducto?.productoId ?? null, payload);
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
              placeholder="Ej: Menu ejecutivo"
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
              Precio
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={precio}
              onChange={(event) => {
                setPrecio(event.target.value);
                setErrors((prev) => ({ ...prev, precio: undefined }));
              }}
              placeholder="0.00"
              className={cn(
                "h-9 bg-gray-50 text-sm border-gray-200",
                errors.precio && "border-red-400 focus-visible:ring-red-300",
              )}
            />
            {errors.precio && (
              <p className="text-xs text-red-500">{errors.precio}</p>
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

export function ProductosConsumoTable({
  productos,
  comedores,
  loading,
  onCreated,
  onUpdated,
  onDeleted,
  modalOpen,
  setModalOpen,
}: ProductosConsumoTableProps) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("nombre");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [editTarget, setEditTarget] = useState<ProductoResponse | null>(null);
  const comedorNameById = useMemo(
    () => Object.fromEntries(comedores.map((item) => [item.id, item.nombre])),
    [comedores],
  );

  const displayed = useMemo(() => {
    const query = search.trim().toLowerCase();
    const next = [...productos].filter((producto) => {
      if (!query) return true;
      return (
        producto.nombre.toLowerCase().includes(query) ||
        (comedorNameById[producto.comedorId] ?? "")
          .toLowerCase()
          .includes(query)
      );
    });

    next.sort((left, right) => {
      let leftValue: string | number = "";
      let rightValue: string | number = "";

      if (sortKey === "productoId") {
        leftValue = left.productoId;
        rightValue = right.productoId;
      }
      if (sortKey === "nombre") {
        leftValue = left.nombre;
        rightValue = right.nombre;
      }
      if (sortKey === "comedorId") {
        leftValue = comedorNameById[left.comedorId] ?? "";
        rightValue = comedorNameById[right.comedorId] ?? "";
      }
      if (sortKey === "precio") {
        leftValue = left.precio;
        rightValue = right.precio;
      }

      if (leftValue < rightValue) return sortDir === "asc" ? -1 : 1;
      if (leftValue > rightValue) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return next;
  }, [comedores, comedorNameById, productos, search, sortDir, sortKey]);

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
    _productoId: number | null,
    payload: CreateProductoRequest | PatchProductoRequest,
  ) => {
    try {
      const created = await apiFetch<ProductoResponse>(
        "/api/consumos/productos",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        token || "",
      );
      onCreated(created);
      toast({ title: "Producto creado" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof ApiError
            ? error.message
            : "No se pudo crear el producto.",
      });
      throw error;
    }
  };

  const handleUpdate = async (
    productoId: number | null,
    payload: CreateProductoRequest | PatchProductoRequest,
  ) => {
    if (productoId === null) return;

    try {
      const updated = await apiFetch<ProductoResponse>(
        `/api/consumos/productos/${productoId}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
        token || "",
      );
      onUpdated(updated);
      toast({ title: "Producto actualizado" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof ApiError
            ? error.message
            : "No se pudo actualizar el producto.",
      });
      throw error;
    }
  };

  const handleDelete = async (producto: ProductoResponse) => {
    try {
      await apiFetch<void>(
        `/api/consumos/productos/${producto.productoId}`,
        {
          method: "DELETE",
        },
        token || "",
      );
      onDeleted(producto.productoId);
      toast({ title: "Producto desactivado" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof ApiError
            ? error.message
            : "No se pudo desactivar el producto.",
      });
    }
  };

  return (
    <>
      <ProductoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        comedores={comedores}
        onSubmit={handleCreate}
        title="Nuevo producto"
        description="Completá los datos del producto de consumo"
        submitLabel="Guardar"
      />

      <ProductoModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        comedores={comedores}
        onSubmit={handleUpdate}
        title="Editar producto"
        description="Actualizá el nombre, comedor o precio"
        submitLabel="Guardar cambios"
        initialProducto={editTarget}
      />

      <div className="border-b px-6 py-4">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar producto o comedor..."
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
            {productos.length === 0
              ? "No hay productos registrados"
              : "Ningún producto coincide con la búsqueda"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100/80 text-left text-xs uppercase tracking-wider text-gray-500">
                {sortableTh("ID", "productoId", "w-20")}
                {sortableTh("Nombre", "nombre")}
                {sortableTh("Comedor", "comedorId")}
                {sortableTh("Precio", "precio", "text-right")}
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="w-20 px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((producto) => (
                <tr
                  key={producto.productoId}
                  className={cn(
                    "border-b transition-colors",
                    producto.activo ? "hover:bg-gray-50/80" : "bg-red-50/30 text-gray-400",
                  )}
                >
                  <td className="px-4 py-4 font-medium">{producto.productoId}</td>
                  <td className="px-4 py-4">{producto.nombre}</td>
                  <td className="px-4 py-4">
                    {comedorNameById[producto.comedorId] ?? producto.comedorId}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {new Intl.NumberFormat("es-AR", {
                      style: "currency",
                      currency: "ARS",
                      minimumFractionDigits: 0,
                    }).format(producto.precio)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        producto.activo
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-600",
                      )}
                    >
                      {producto.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditTarget(producto)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {producto.activo && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(producto)}
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      )}
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
