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
import { UsuarioResponse } from "@/models/dto/auth/UsuarioResponse";
import { apiFetch } from "@/lib/api";
import { ApiError } from "@/models/dto/ApiError";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";

// ── Types ─────────────────────────────────────────────────────────────────────

type Rol = "ADMIN" | "ENCARGADO" | "CONTABILIDAD";
type SortKey = "cuil" | "nombre" | "rol";
type SortDir = "asc" | "desc";

export interface UsuarioTableProps {
  usuarios: UsuarioResponse[];
  loading: boolean;
  onCreated: (usuario: UsuarioResponse) => void;
  onUpdated?: (usuario: UsuarioResponse) => void;
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROL_LABELS: Record<Rol, string> = {
  ADMIN: "Admin",
  ENCARGADO: "Encargado",
  CONTABILIDAD: "Contabilidad",
};

const ROL_STYLES: Record<Rol, string> = {
  ADMIN: "bg-violet-100 text-violet-700",
  ENCARGADO: "bg-blue-100 text-blue-700",
  CONTABILIDAD: "bg-amber-100 text-amber-700",
};

function RolBadge({ rol }: { rol: Rol }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        ROL_STYLES[rol] ?? "bg-gray-100 text-gray-600",
      )}
    >
      {ROL_LABELS[rol] ?? rol}
    </span>
  );
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
  if (col !== sortKey)
    return <ChevronsUpDown className="ml-1 inline h-3 w-3 opacity-30" />;
  return sortDir === "asc" ? (
    <ChevronUp className="ml-1 inline h-3 w-3 text-primary" />
  ) : (
    <ChevronDown className="ml-1 inline h-3 w-3 text-primary" />
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function NuevoUsuarioModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (usuario: UsuarioResponse) => void;
}) {
  const [cuil, setCuil] = useState("");
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState<Rol | "">("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{
    cuil?: string;
    nombre?: string;
    rol?: string;
    password?: string;
  }>({});
  const { token } = useAuth();
  const { toast } = useToast();

  const handleClose = () => {
    setCuil("");
    setNombre("");
    setRol("");
    setPassword("");
    setErrors({});
    onClose();
  };

  const validate = () => {
    const next: typeof errors = {};
    if (!cuil.trim()) {
      next.cuil = "El CUIL es obligatorio.";
    } else if (!/^\d{11}$/.test(cuil.trim())) {
      next.cuil = "El CUIL debe tener exactamente 11 dígitos.";
    }
    if (!nombre.trim()) next.nombre = "El nombre es obligatorio.";
    if (!rol) next.rol = "Seleccioná un rol.";
    if (!password) {
      next.password = "La contraseña es obligatoria.";
    } else if (password.length < 6) {
      next.password = "La contraseña debe tener al menos 6 caracteres.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleGuardar = async () => {
    if (!validate()) return;
    setSaving(true);
    setErrors({});
    try {
      const response = await apiFetch<UsuarioResponse>(
        "/api/usuarios/register",
        {
          method: "POST",
          body: JSON.stringify({
            cuil: cuil.trim(),
            nombre: nombre.trim(),
            rol,
            password,
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
            Nuevo Usuario
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Completá los datos del usuario
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* CUIL */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
              CUIL
            </label>
            <Input
              autoFocus
              value={cuil}
              onChange={(e) => {
                // Allow only digits, max 11
                const val = e.target.value.replace(/\D/g, "").slice(0, 11);
                setCuil(val);
                setErrors((prev) => ({ ...prev, cuil: undefined }));
              }}
              placeholder="Ej: 20123456789"
              inputMode="numeric"
              className={cn(
                "h-9 text-sm bg-gray-50 border-gray-200 font-mono tracking-wider",
                errors.cuil && "border-red-400 focus-visible:ring-red-300",
              )}
            />
            {errors.cuil ? (
              <p className="text-xs text-red-500">{errors.cuil}</p>
            ) : (
              <p className="text-xs text-gray-400">{cuil.length}/11 dígitos</p>
            )}
          </div>

          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Nombre
            </label>
            <Input
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                setErrors((prev) => ({ ...prev, nombre: undefined }));
              }}
              placeholder="Ej: Juan Pérez"
              className={cn(
                "h-9 text-sm bg-gray-50 border-gray-200",
                errors.nombre && "border-red-400 focus-visible:ring-red-300",
              )}
            />
            {errors.nombre && (
              <p className="text-xs text-red-500">{errors.nombre}</p>
            )}
          </div>

          {/* Rol */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Rol
            </label>
            <Select
              value={rol}
              onValueChange={(val) => {
                setRol(val as Rol);
                setErrors((prev) => ({ ...prev, rol: undefined }));
              }}
            >
              <SelectTrigger
                className={cn(
                  "h-9 text-sm bg-gray-50 border-gray-200",
                  errors.rol && "border-red-400 focus-visible:ring-red-300",
                )}
              >
                <SelectValue placeholder="Seleccioná un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="ENCARGADO">Encargado</SelectItem>
                <SelectItem value="CONTABILIDAD">Contabilidad</SelectItem>
              </SelectContent>
            </Select>
            {errors.rol && <p className="text-xs text-red-500">{errors.rol}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Contraseña
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              onKeyDown={(e) => e.key === "Enter" && handleGuardar()}
              placeholder="Mínimo 6 caracteres"
              className={cn(
                "h-9 text-sm bg-gray-50 border-gray-200",
                errors.password && "border-red-400 focus-visible:ring-red-300",
              )}
            />
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password}</p>
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

function EditarUsuarioModal({
  open,
  onClose,
  usuario,
  onUpdated,
}: {
  open: boolean;
  onClose: () => void;
  usuario: UsuarioResponse;
  onUpdated: (usuario: UsuarioResponse) => void;
}) {
  const [cuil, setCuil] = useState(String(usuario.cuil));
  const [nombre, setNombre] = useState(usuario.nombre);
  const [rol, setRol] = useState<Rol>(usuario.rol as Rol);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ cuil?: string; nombre?: string; rol?: string; password?: string }>({});
  const { token } = useAuth();
  const { toast } = useToast();

  const handleClose = () => {
    setCuil(String(usuario.cuil));
    setNombre(usuario.nombre);
    setRol(usuario.rol as Rol);
    setPassword("");
    setErrors({});
    onClose();
  };

  const handleGuardar = async () => {
    const next: typeof errors = {};
    if (!cuil.trim()) {
      next.cuil = "El CUIL es obligatorio.";
    } else if (!/^\d{11}$/.test(cuil.trim())) {
      next.cuil = "El CUIL debe tener exactamente 11 dígitos.";
    }
    if (!nombre.trim()) next.nombre = "El nombre es obligatorio.";
    if (!rol) next.rol = "Seleccioná un rol.";
    if (password.length > 0) {
      if (!password.trim()) {
        next.password = "La contraseña no puede estar vacía.";
      } else if (password.length < 6) {
        next.password = "La contraseña debe tener al menos 6 caracteres.";
      }
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      const body: { cuil: number; nombre: string; rol: Rol; password?: string } = {
        cuil: Number(cuil.trim()),
        nombre: nombre.trim(),
        rol,
      };

      if (password.length > 0) {
        body.password = password;
      }

      const response = await apiFetch<UsuarioResponse>(
        `/api/usuarios/${usuario.cuil}`,
        { method: "PATCH", body: JSON.stringify(body) },
        token || "",
      );

      onUpdated(response);
      onClose();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error de red. Intentá de nuevo.";
      toast({ variant: "destructive", title: "Error", description: msg });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-sm rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="border-b px-6 py-4">
          <h2 className="text-base font-semibold text-gray-800">Editar Usuario</h2>
          <p className="text-xs text-gray-500 mt-0.5 font-mono">{usuario.cuil}</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">CUIL</label>
            <Input
              autoFocus
              value={cuil}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 11);
                setCuil(value);
                setErrors((p) => ({ ...p, cuil: undefined }));
              }}
              placeholder="Ej: 20123456789"
              inputMode="numeric"
              className={cn("h-9 text-sm bg-gray-50 border-gray-200 font-mono tracking-wider", errors.cuil && "border-red-400 focus-visible:ring-red-300")}
            />
            {errors.cuil ? (
              <p className="text-xs text-red-500">{errors.cuil}</p>
            ) : (
              <p className="text-xs text-gray-400">{cuil.length}/11 dígitos</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Nombre</label>
            <Input
              value={nombre}
              onChange={(e) => { setNombre(e.target.value); setErrors((p) => ({ ...p, nombre: undefined })); }}
              placeholder="Ej: Juan Pérez"
              className={cn("h-9 text-sm bg-gray-50 border-gray-200", errors.nombre && "border-red-400 focus-visible:ring-red-300")}
            />
            {errors.nombre && <p className="text-xs text-red-500">{errors.nombre}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Rol</label>
            <Select value={rol} onValueChange={(val) => { setRol(val as Rol); setErrors((p) => ({ ...p, rol: undefined })); }}>
              <SelectTrigger className={cn("h-9 text-sm bg-gray-50 border-gray-200", errors.rol && "border-red-400 focus-visible:ring-red-300")}>
                <SelectValue placeholder="Seleccioná un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="ENCARGADO">Encargado</SelectItem>
                <SelectItem value="CONTABILIDAD">Contabilidad</SelectItem>
              </SelectContent>
            </Select>
            {errors.rol && <p className="text-xs text-red-500">{errors.rol}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Nueva contraseña</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((p) => ({ ...p, password: undefined }));
              }}
              onKeyDown={(e) => e.key === "Enter" && handleGuardar()}
              placeholder="Dejar vacía para no cambiarla"
              className={cn("h-9 text-sm bg-gray-50 border-gray-200", errors.password && "border-red-400 focus-visible:ring-red-300")}
            />
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
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

export function UsuarioTable({
  usuarios,
  loading,
  onCreated,
  onUpdated,
  modalOpen,
  setModalOpen,
}: UsuarioTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("nombre");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [editTarget, setEditTarget] = useState<UsuarioResponse | null>(null);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = [...usuarios].sort((a, b) => {
    const av: string = String(a[sortKey] ?? "");
    const bv: string = String(b[sortKey] ?? "");
    return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
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
      <NuevoUsuarioModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={onCreated}
      />

      {editTarget && (
        <EditarUsuarioModal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          usuario={editTarget}
          onUpdated={(updated) => { onUpdated?.(updated); setEditTarget(null); }}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : usuarios.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
          <SlidersHorizontal className="h-8 w-8 opacity-40" />
          <p className="text-sm">No hay usuarios registrados</p>
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
                  {sortableTh("CUIL", "cuil", "w-36")}
                  {sortableTh("Nombre", "nombre")}
                  {sortableTh("Rol", "rol", "w-36")}
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((usuario) => (
                  <tr
                    key={usuario.cuil}
                    className="border-b transition-colors hover:bg-gray-50/80"
                  >
                    <td className="px-4 py-4 font-mono text-gray-500 text-xs tracking-wider">
                      {usuario.cuil}
                    </td>
                    <td className="px-4 py-4 font-medium text-gray-800">
                      {usuario.nombre}
                    </td>
                    <td className="px-4 py-4">
                      <RolBadge rol={usuario.rol as Rol} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditTarget(usuario)}
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
