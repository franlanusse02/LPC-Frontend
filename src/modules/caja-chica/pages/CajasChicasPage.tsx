import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, ListChecks, Pencil, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { Spinner } from "@/components/ui/spinner";
import { DataTable } from "@/components/data-table";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import type { CajaChicaResponse } from "@/domain/dto/caja-chica/CajaChicaResponse";
import type {
  CreateCajaChicaRequest,
  PatchCajaChicaRequest,
  SetAccesosRequest,
} from "@/domain/dto/caja-chica/CajaChicaRequest";
import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";
import type { UsuarioResponse } from "@/domain/dto/auth/UsuarioResponse";
import { formatMonto, perteneceA } from "../format";

type Dueno = "COMEDOR" | "CUENTA";

export default function CajasChicasPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const isAdmin = session?.rol === "ADMIN";
  const { get, post, patch, put } = useApi();

  const [cajas, setCajas] = useState<CajaChicaResponse[] | null>(null);
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResponse[]>([]);
  const [saving, setSaving] = useState(false);

  // Create / edit dialog
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CajaChicaResponse | null>(null);
  const [nombre, setNombre] = useState("");
  const [dueno, setDueno] = useState<Dueno>("COMEDOR");
  const [comedorId, setComedorId] = useState("");
  const [titularId, setTitularId] = useState("");
  const [activa, setActiva] = useState(true);
  const [accesoIds, setAccesoIds] = useState<string[]>([]);

  // Accesos dialog
  const [accesosDe, setAccesosDe] = useState<CajaChicaResponse | null>(null);

  useEffect(() => {
    get("/cajas-chicas")
      .then((r) => r.json())
      .then(setCajas)
      .catch((err) => {
        setCajas([]);
        toast.error(err instanceof Error ? err.message : "No se pudieron cargar las cajas.");
      });
    if (isAdmin) {
      get("/comedores").then((r) => r.json()).then(setComedores);
      get("/usuarios").then((r) => r.json()).then(setUsuarios);
    }
  }, [get, isAdmin]);

  const usuarioOptions = usuarios.map((u) => ({
    value: String(u.id),
    label: u.nombre,
    subtitle: u.rol,
  }));

  const reemplazar = (saved: CajaChicaResponse) =>
    setCajas((prev) =>
      [...(prev ?? []).filter((c) => c.id !== saved.id), saved].sort((a, b) =>
        a.nombre.localeCompare(b.nombre),
      ),
    );

  const openCreate = () => {
    setEditing(null);
    setNombre("");
    setDueno("COMEDOR");
    setComedorId("");
    setTitularId("");
    setActiva(true);
    setAccesoIds([]);
    setModalOpen(true);
  };

  const openEdit = (c: CajaChicaResponse) => {
    setEditing(c);
    setNombre(c.nombre);
    setActiva(c.activa);
    setModalOpen(true);
  };

  const openAccesos = (c: CajaChicaResponse) => {
    setAccesosDe(c);
    setAccesoIds(c.accesos.map((a) => String(a.usuarioId)));
  };

  const handleSave = async () => {
    if (!nombre.trim()) {
      toast.error("Poné un nombre.");
      return;
    }
    if (!editing && dueno === "COMEDOR" && !comedorId) {
      toast.error("Elegí el comedor.");
      return;
    }
    if (!editing && dueno === "CUENTA" && !titularId) {
      toast.error("Elegí la cuenta.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const body: PatchCajaChicaRequest = { nombre: nombre.trim(), activa };
        reemplazar(await (await patch(`/cajas-chicas/${editing.id}`, body)).json());
        toast.success("Caja actualizada");
      } else {
        const body: CreateCajaChicaRequest = {
          nombre: nombre.trim(),
          comedorId: dueno === "COMEDOR" ? Number(comedorId) : null,
          titularUsuarioId: dueno === "CUENTA" ? Number(titularId) : null,
          accesoUsuarioIds: accesoIds.map(Number),
        };
        reemplazar(await (await post("/cajas-chicas", body)).json());
        toast.success("Caja creada");
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la caja.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAccesos = async () => {
    if (!accesosDe) return;
    setSaving(true);
    try {
      const body: SetAccesosRequest = { usuarioIds: accesoIds.map(Number) };
      reemplazar(await (await put(`/cajas-chicas/${accesosDe.id}/accesos`, body)).json());
      toast.success("Accesos actualizados");
      setAccesosDe(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudieron guardar los accesos.");
    } finally {
      setSaving(false);
    }
  };

  // CARGA_DATOS is write-only: its only caja chica screen is the loading form.
  if (session?.rol === "CARGA_DATOS") return <Navigate to="/caja-chica/cargar" replace />;

  if (cajas === null)
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
          <div className="flex flex-row justify-between w-full gap-2">
            <CardTitle className="tracking-wide">
              <h1 className="text-xl font-bold text-gray-800 uppercase">Caja Chica</h1>
              <p className="text-sm text-gray-500 mt-1">
                Saldo de cada caja: ingresos menos egresos, sin contar los anulados.
              </p>
            </CardTitle>
            {isAdmin && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate("/caja-chica/conceptos")}
                  className="gap-2 font-bold"
                >
                  <ListChecks className="h-4 w-4" /> CONCEPTOS
                </Button>
                <Button size="sm" onClick={openCreate} className="gap-2 font-bold">
                  <Plus className="h-4 w-4" /> NUEVA
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {cajas.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-gray-400">
              No tenés cajas chicas asignadas.
            </p>
          ) : (
            <DataTable
              displayedCount={cajas.length}
              columns={
                <>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Pertenece a
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-gray-500">
                    Saldo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500 w-28">
                    Estado
                  </th>
                  {isAdmin && <th className="px-4 py-3 w-28" />}
                </>
              }
              rows={cajas.map((c) => (
                <tr
                  key={c.id}
                  className="border-b hover:bg-gray-50/60 cursor-pointer"
                  onClick={() => navigate(`/caja-chica/${c.id}`)}
                >
                  <td className="px-6 py-4 font-medium">{c.nombre}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{perteneceA(c)}</td>
                  <td
                    className={`px-6 py-4 text-right font-mono tabular-nums ${
                      c.saldo < 0 ? "text-red-600" : "text-gray-800"
                    }`}
                  >
                    {formatMonto(c.saldo)}
                  </td>
                  <td className="px-6 py-4">
                    {c.activa ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                        Activa
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                        Cerrada
                      </span>
                    )}
                  </td>
                  {isAdmin && (
                    <td
                      className="px-6 py-4 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 px-2 text-gray-600"
                        onClick={() => openAccesos(c)}
                      >
                        <Users className="h-4 w-4" />
                        {c.accesos.length}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(c)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            ></DataTable>
          )}
        </CardContent>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">{editing ? "Editar" : "Nueva"} Caja Chica</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Nombre</label>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Caja chica cocina"
                  autoFocus
                />
              </div>

              {editing ? (
                <>
                  <p className="text-sm text-gray-500">{perteneceA(editing)}</p>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={activa}
                      onChange={(e) => setActiva(e.target.checked)}
                    />
                    Activa (una caja cerrada no admite movimientos nuevos)
                  </label>
                </>
              ) : (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Pertenece a</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["COMEDOR", "CUENTA"] as const).map((d) => (
                        <Button
                          key={d}
                          type="button"
                          variant={dueno === d ? "default" : "outline"}
                          onClick={() => setDueno(d)}
                        >
                          {d === "COMEDOR" ? "Un comedor" : "Una cuenta"}
                        </Button>
                      ))}
                    </div>
                  </div>
                  {dueno === "COMEDOR" ? (
                    <div>
                      <label className="mb-1 block text-sm font-medium">Comedor</label>
                      <Combobox
                        options={comedores.map((c) => ({ value: String(c.id), label: c.nombre }))}
                        value={comedorId}
                        onChange={setComedorId}
                        placeholder="Elegí un comedor"
                        className="w-full"
                      />
                      <p className="mt-1 text-xs text-gray-400">
                        La ven administración, contabilidad y los encargados de ese comedor.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="mb-1 block text-sm font-medium">Cuenta</label>
                      <Combobox
                        options={usuarioOptions}
                        value={titularId}
                        onChange={setTitularId}
                        placeholder="Elegí una cuenta"
                        className="w-full"
                      />
                      <p className="mt-1 text-xs text-gray-400">
                        La ven administración y esa cuenta.
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="mb-1 block text-sm font-medium">Acceso adicional</label>
                    <MultiCombobox
                      options={usuarioOptions}
                      values={accesoIds}
                      onChange={setAccesoIds}
                      placeholder="Nadie más"
                      className="w-full"
                    />
                  </div>
                </>
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

      {accesosDe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">Acceso adicional</h2>
            <p className="mb-4 text-sm text-gray-500">
              {accesosDe.nombre} · {perteneceA(accesosDe)}
            </p>
            <MultiCombobox
              options={usuarioOptions}
              values={accesoIds}
              onChange={setAccesoIds}
              placeholder="Nadie más"
              className="w-full"
            />
            <p className="mt-2 text-xs text-gray-400">
              Estas cuentas ven la caja y cargan movimientos, además de quienes ya tienen acceso por
              su rol.
            </p>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setAccesosDe(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveAccesos} disabled={saving}>
                {saving ? <Spinner className="h-4 w-4" /> : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
