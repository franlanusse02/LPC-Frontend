import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { DataTable, SortableTh } from "@/components/data-table";
import { useApi } from "@/hooks/useApi";
import type { UsuarioResponse } from "@/domain/dto/auth/UsuarioResponse";
import type { UserRole } from "@/domain/enums/UserRole";

type SortKey = "cuil" | "nombre" | "rol";

const ROL_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  ENCARGADO: "Encargado",
  CONTABILIDAD: "Contabilidad",
};

const ROL_STYLES: Record<UserRole, string> = {
  ADMIN: "bg-violet-100 text-violet-700",
  ENCARGADO: "bg-blue-100 text-blue-700",
  CONTABILIDAD: "bg-amber-100 text-amber-700",
};

function RolBadge({ rol }: { rol: UserRole }) {
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

export default function UsuariosPage() {
  const navigate = useNavigate();
  const { get, post, patch } = useApi();

  const [usuarios, setUsuarios] = useState<UsuarioResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UsuarioResponse | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("nombre");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [cuil, setCuil] = useState("");
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState<UserRole | "">("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    get("/usuarios")
      .then((r) => r.json())
      .then((data) => {
        setUsuarios(data);
        setLoading(false);
      });
  }, [get]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = [...usuarios].sort((a, b) => {
    const av = String(a[sortKey] ?? "");
    const bv = String(b[sortKey] ?? "");
    return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const openCreate = () => {
    setEditing(null);
    setCuil("");
    setNombre("");
    setRol("");
    setPassword("");
    setModalOpen(true);
  };

  const openEdit = (u: UsuarioResponse) => {
    setEditing(u);
    setCuil(u.cuil);
    setNombre(u.nombre);
    setRol(u.rol);
    setPassword("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!nombre.trim() || !cuil.trim() || (editing ? false : !rol || !password)) {
      toast.error("Completá CUIL y nombre");
      return;
    }
    setSaving(true);
    try {
      const body = editing
        ? { cuil: cuil.trim(), nombre: nombre.trim(), rol }
        : {
            cuil: cuil.trim(),
            nombre: nombre.trim(),
            rol: rol as UserRole,
            password,
          };
      const res = editing
        ? await patch(`/usuarios/${editing.cuil}`, body)
        : await post("/usuarios/register", body);
      if (!res.ok) throw new Error();
      const saved = (await res.json()) as UsuarioResponse;
      setUsuarios((prev) =>
        editing
          ? prev.map((u) => (u.cuil === editing.cuil ? saved : u))
          : [...prev, saved],
      );
      toast.success(editing ? "Usuario actualizado" : "Usuario creado");
      setModalOpen(false);
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );

  return (
    <div className="px-18 py-8">
      <div className="max-w-2/3 mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
      </div>

      <Card className="mx-auto max-w-2/3 border-0 shadow-md mt-4">
        <CardHeader className="border-b px-6 py-4">
          <div className="flex flex-row justify-between w-full">
            <CardTitle className="tracking-wide">
              <h1 className="text-xl font-bold text-gray-800 uppercase">
                Usuarios
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Gestioná los usuarios del sistema
              </p>
            </CardTitle>
            <Button size="sm" onClick={openCreate} className="gap-2 font-bold">
              <Plus className="h-4 w-4" /> NUEVO
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            displayedCount={sorted.length}
            columns={
              <>
                <SortableTh
                  label="CUIL"
                  col="cuil"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="w-36"
                />
                <SortableTh
                  label="Nombre"
                  col="nombre"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Rol"
                  col="rol"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="w-36"
                />
                <th className="px-4 py-3 w-12" />
              </>
            }
            rows={sorted.map((u) => (
              <tr key={u.cuil} className="border-b hover:bg-gray-50/60">
                <td className="px-6 py-4 font-mono text-xs tracking-wider text-gray-500">
                  {u.cuil}
                </td>
                <td className="px-6 py-4 font-medium">{u.nombre}</td>
                <td className="px-6 py-4">
                  <RolBadge rol={u.rol} />
                </td>
                <td className="px-6 py-4 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(u)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          ></DataTable>
        </CardContent>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">
              {editing ? "Editar" : "Nuevo"} Usuario
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">CUIL</label>
                <Input
                  value={cuil}
                  onChange={(e) =>
                    setCuil(e.target.value.replace(/\D/g, "").slice(0, 11))
                  }
                  placeholder="11 dígitos"
                  inputMode="numeric"
                  className="font-mono"
                  autoFocus={!editing}
                />
                <p className="mt-1 text-xs text-gray-400">
                  {cuil.length}/11 dígitos
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Nombre</label>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre completo"
                  autoFocus={!!editing}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Rol</label>
                <Select
                  value={rol}
                  onValueChange={(v) => setRol(v as UserRole)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="ENCARGADO">Encargado</SelectItem>
                    <SelectItem value="CONTABILIDAD">Contabilidad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!editing && (
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Contraseña
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
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
          </div>
        </div>
      )}
    </div>
  );
}
