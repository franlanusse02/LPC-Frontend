import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Spinner } from "@/components/ui/spinner";
import { DataTable, SortableTh } from "@/components/data-table";
import { ConfirmDialog } from "@/modules/compras/components/ConfirmDialog";
import { useApi } from "@/hooks/useApi";
import type { UsuarioResponse } from "@/domain/dto/auth/UsuarioResponse";
import type { RegisterRequest } from "@/domain/dto/auth/RegisterRequest";
import type { PatchUsuarioRequest } from "@/domain/dto/auth/PatchUsuarioRequest";
import type { LegajoResponse } from "@/domain/dto/legajo/LegajoResponse";
import type { UserRole } from "@/domain/enums/UserRole";

type SortKey = "cuil" | "nombre" | "rol";

const MIN_PASSWORD = 8;

const ROL_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  ENCARGADO: "Encargado",
  CONTABILIDAD: "Contabilidad",
  CARGA_DATOS: "Carga Datos",
};

const ROL_STYLES: Record<UserRole, string> = {
  ADMIN: "bg-violet-100 text-violet-700",
  ENCARGADO: "bg-blue-100 text-blue-700",
  CONTABILIDAD: "bg-amber-100 text-amber-700",
  CARGA_DATOS: "bg-gray-100 text-gray-700",
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
  const { get, post, patch, del } = useApi();

  const [usuarios, setUsuarios] = useState<UsuarioResponse[]>([]);
  const [legajos, setLegajos] = useState<LegajoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UsuarioResponse | null>(null);
  const [deleting, setDeleting] = useState<UsuarioResponse | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("nombre");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [legajoId, setLegajoId] = useState("");
  const [rol, setRol] = useState<UserRole | "">("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    Promise.all([
      get("/usuarios").then((r) => r.json()),
      get("/legajos").then((r) => r.json()),
    ]).then(([usuariosData, legajosData]) => {
      setUsuarios(usuariosData);
      setLegajos(legajosData);
      setLoading(false);
    });
  }, [get]);

  // An account is created from a legajo that has no active account yet.
  const legajosSinCuenta = legajos.filter((l) => l.usuarioId === null);

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
    setLegajoId("");
    setRol("");
    setPassword("");
    setModalOpen(true);
  };

  const openEdit = (u: UsuarioResponse) => {
    setEditing(u);
    setLegajoId("");
    setRol(u.rol);
    setPassword("");
    setModalOpen(true);
  };

  const setLegajoUsuario = (legajo: number, usuarioId: number | null) =>
    setLegajos((prev) => prev.map((l) => (l.id === legajo ? { ...l, usuarioId } : l)));

  const handleSave = async () => {
    if (editing ? !rol : !legajoId || !rol || !password) {
      toast.error(editing ? "Elegí un rol." : "Completá el legajo, el rol y la contraseña.");
      return;
    }
    if (password && password.length < MIN_PASSWORD) {
      toast.error(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const body: PatchUsuarioRequest = { rol, ...(password ? { password } : {}) };
        const saved = (await (await patch(`/usuarios/${editing.id}`, body)).json()) as UsuarioResponse;
        setUsuarios((prev) => prev.map((u) => (u.id === saved.id ? saved : u)));
        toast.success("Usuario actualizado");
      } else {
        const body: RegisterRequest = { legajoId: Number(legajoId), rol, password };
        const res = await post("/usuarios/register", body);
        const saved = (await res.json()) as UsuarioResponse;
        setUsuarios((prev) => [...prev.filter((u) => u.id !== saved.id), saved]);
        setLegajoUsuario(Number(legajoId), saved.id);
        // 200 = the legajo's previously deleted account came back, with its history.
        toast.success(res.status === 200 ? "Usuario reactivado" : "Usuario creado");
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el usuario.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await del(`/usuarios/${deleting.id}`);
      setUsuarios((prev) => prev.filter((u) => u.id !== deleting.id));
      setLegajos((prev) => prev.map((l) => (l.usuarioId === deleting.id ? { ...l, usuarioId: null } : l)));
      toast.success("Usuario eliminado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar el usuario.");
      throw err;
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );

  return (
    <div className="px-4 sm:px-8 lg:px-18 py-8">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
      </div>

      <Card className="mx-auto max-w-7xl border-0 shadow-md mt-4">
        <CardHeader className="border-b px-6 py-4">
          <div className="flex flex-row justify-between w-full">
            <CardTitle className="tracking-wide">
              <h1 className="text-xl font-bold text-gray-800 uppercase">
                Usuarios
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Gestioná los usuarios del sistema. Cada usuario pertenece a un legajo.
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
                <th className="px-4 py-3 w-24" />
              </>
            }
            rows={sorted.map((u) => (
              <tr key={u.id} className="border-b hover:bg-gray-50/60">
                <td className="px-6 py-4 font-mono text-xs tracking-wider text-gray-500">
                  {u.cuil}
                </td>
                <td className="px-6 py-4 font-medium">{u.nombre}</td>
                <td className="px-6 py-4">
                  <RolBadge rol={u.rol} />
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(u)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600"
                    onClick={() => setDeleting(u)}
                  >
                    <Trash2 className="h-4 w-4" />
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
              {editing ? (
                <div className="rounded-md bg-gray-50 px-3 py-2 text-sm">
                  <p className="font-medium">{editing.nombre}</p>
                  <p className="font-mono text-xs text-gray-500">{editing.cuil}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    El CUIL y el nombre se editan en el legajo.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-sm font-medium">Legajo</label>
                  <Combobox
                    options={legajosSinCuenta.map((l) => ({
                      value: String(l.id),
                      label: l.nombre,
                      subtitle: String(l.taxId),
                    }))}
                    value={legajoId}
                    onChange={setLegajoId}
                    placeholder="Seleccionar legajo..."
                    searchPlaceholder="Buscar por nombre..."
                    className="w-full"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    ¿No está la persona?{" "}
                    <button
                      type="button"
                      className="underline"
                      onClick={() => navigate("/legajos")}
                    >
                      Creá su legajo primero
                    </button>
                    .
                  </p>
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium">Rol</label>
                <Combobox
                  options={[
                    { value: "ADMIN", label: "Admin" },
                    { value: "ENCARGADO", label: "Encargado" },
                    { value: "CONTABILIDAD", label: "Contabilidad" },
                    { value: "CARGA_DATOS", label: "Carga Datos" },
                  ]}
                  value={rol}
                  onChange={(v) => setRol(v as UserRole)}
                  placeholder="Seleccionar..."
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Contraseña
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    editing
                      ? "Dejar vacío para no cambiarla"
                      : `Mínimo ${MIN_PASSWORD} caracteres`
                  }
                />
              </div>
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

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Eliminar usuario"
        description={
          <>
            <strong>{deleting?.nombre}</strong> no va a poder ingresar más. Su legajo y su
            historial se conservan; si le volvés a crear un usuario, se reactiva este mismo.
          </>
        }
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
      />
    </div>
  );
}
