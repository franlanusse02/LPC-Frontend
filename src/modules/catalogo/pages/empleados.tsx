import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Spinner } from "@/components/ui/spinner";
import { DataTable, SortableTh } from "@/components/data-table";
import { useApi } from "@/hooks/useApi";
import type { EmpleadoComedorResponse } from "@/domain/dto/comedor/EmpleadoComedorResponse";
import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";
import type { CentroCostoResponse } from "@/domain/dto/catalogo/CentroCostoResponse";
import type { PartidaResponse } from "@/domain/dto/catalogo/PartidaResponse";

type SortKey = "nombre" | "comedor" | "email" | "taxId";

export default function EmpleadosPage() {
  const navigate = useNavigate();
  const { get, post, patch, del } = useApi();

  const [empleados, setEmpleados] = useState<EmpleadoComedorResponse[] | null>(null);
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [comedorDeps, setComedorDeps] = useState<{ centrosCosto: CentroCostoResponse[]; partidas: PartidaResponse[] }>({ centrosCosto: [], partidas: [] });
  const { centrosCosto, partidas } = comedorDeps;
  const loading = empleados === null;
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EmpleadoComedorResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmpleadoComedorResponse | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("nombre");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [nombre, setNombre] = useState("");
  const [comedorId, setComedorId] = useState("");
  const [email, setEmail] = useState("");
  const [taxId, setTaxId] = useState("");
  const [centroCostoId, setCentroCostoId] = useState("");
  const [partidaId, setPartidaId] = useState("");

  useEffect(() => {
    Promise.all([
      get("/comedores/empleados").then((r) => r.json()),
      get("/comedores").then((r) => r.json()),
    ]).then(([empleadosData, comedoresData]) => {
      setEmpleados(empleadosData);
      setComedores(comedoresData);
    });
  }, [get]);

  useEffect(() => {
    if (!comedorId) {
      setComedorDeps({ centrosCosto: [], partidas: [] });
      return;
    }
    Promise.all([
      get(`/comedores/centros-costo?comedorId=${comedorId}`).then((r) => r.json()),
      get(`/comedores/partidas?comedorId=${comedorId}`).then((r) => r.json()),
    ]).then(([ccData, pData]) => {
      setComedorDeps({ centrosCosto: ccData, partidas: pData });
    });
  }, [comedorId, get]);

  const ccOptions = useMemo(
    () => centrosCosto.filter((c) => c.activo).map((c) => ({ value: String(c.id), label: c.nombre })),
    [centrosCosto],
  );

  const partidaOptions = useMemo(
    () => partidas.filter((p) => p.activo).map((p) => ({ value: String(p.id), label: p.nombre })),
    [partidas],
  );

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = [...(empleados ?? []).filter((e) => e.activo)].sort((a, b) => {
    const av =
      sortKey === "comedor"
        ? (comedores.find((c) => c.id === a.comedorId)?.nombre ?? "")
        : String(a[sortKey] ?? "");
    const bv =
      sortKey === "comedor"
        ? (comedores.find((c) => c.id === b.comedorId)?.nombre ?? "")
        : String(b[sortKey] ?? "");
    return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const comedorMap = new Map(comedores.map((c) => [c.id, c.nombre]));

  const openCreate = () => {
    setEditing(null);
    setNombre("");
    setComedorId("");
    setEmail("");
    setTaxId("");
    setCentroCostoId("");
    setPartidaId("");
    setModalOpen(true);
  };

  const openEdit = (e: EmpleadoComedorResponse) => {
    setEditing(e);
    setNombre(e.nombre);
    setComedorId(String(e.comedorId));
    setEmail(e.email ?? "");
    setTaxId(e.taxId ? String(e.taxId) : "");
    setCentroCostoId(e.centroCostoId ? String(e.centroCostoId) : "");
    setPartidaId(e.partidaId ? String(e.partidaId) : "");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!nombre.trim() || !comedorId) {
      toast.error("Completá el nombre y el comedor del empleado.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        nombre: nombre.trim(),
        comedorId: Number(comedorId),
        email: email.trim() || null,
        taxId: taxId ? Number(taxId) : null,
        centroCostoId: centroCostoId ? Number(centroCostoId) : null,
        partidaId: partidaId ? Number(partidaId) : null,
      };
      const res = editing
        ? await patch(`/comedores/empleados/${editing.id}`, body)
        : await post("/comedores/empleados", body);
      const saved = (await res.json()) as EmpleadoComedorResponse;
      setEmpleados((prev) =>
        editing
          ? (prev ?? []).map((e) => (e.id === saved.id ? saved : e))
          : [...(prev ?? []), saved],
      );
      toast.success(editing ? "Empleado actualizado" : "Empleado creado");
      setModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el empleado.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await del(`/comedores/empleados/${deleteTarget.id}`);
      setEmpleados((prev) => (prev ?? []).filter((e) => e.id !== deleteTarget.id));
      toast.success("Empleado eliminado");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar el empleado.");
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
                Empleados
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Gestioná los empleados de los comedores
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
                <SortableTh label="Nombre" col="nombre" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh label="Comedor" col="comedor" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh label="Email" col="email" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh label="CUIL" col="taxId" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3">Centro Costo</th>
                <th className="px-4 py-3">Partida</th>
                <th className="px-4 py-3 w-20" />
              </>
            }
            rows={sorted.map((e) => (
              <tr key={e.id} className="border-b hover:bg-gray-50/60">
                <td className="px-6 py-4 font-medium">{e.nombre}</td>
                <td className="px-6 py-4 text-gray-600">
                  {comedorMap.get(e.comedorId) ?? `ID ${e.comedorId}`}
                </td>
                <td className="px-6 py-4 text-gray-500">{e.email ?? "—"}</td>
                <td className="px-6 py-4 font-mono text-sm">{e.taxId ?? "—"}</td>
                <td className="px-6 py-4 text-gray-500">{e.centroCostoNombre ?? "—"}</td>
                <td className="px-6 py-4 text-gray-500">{e.partidaNombre ?? "—"}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(e)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => setDeleteTarget(e)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
              {editing ? "Editar" : "Nuevo"} Empleado
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Comedor</label>
                <Combobox
                  options={comedores.map((c) => ({ value: String(c.id), label: c.nombre }))}
                  value={comedorId}
                  onChange={(v) => { setComedorId(v); setCentroCostoId(""); setPartidaId(""); }}
                  placeholder="Seleccionar..."
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Nombre</label>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre completo"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Email{" "}
                  <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  CUIL{" "}
                  <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <Input
                  value={taxId}
                  onChange={(e) =>
                    setTaxId(e.target.value.replace(/\D/g, "").slice(0, 11))
                  }
                  placeholder="CUIL"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Centro de Costo{" "}
                  <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <Combobox
                  options={ccOptions}
                  value={centroCostoId}
                  onChange={setCentroCostoId}
                  placeholder={!comedorId ? "Seleccioná un comedor primero..." : "Seleccionar..."}
                  disabled={!comedorId}
                  clearable
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Partida{" "}
                  <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <Combobox
                  options={partidaOptions}
                  value={partidaId}
                  onChange={setPartidaId}
                  placeholder={!comedorId ? "Seleccioná un comedor primero..." : "Seleccionar..."}
                  disabled={!comedorId}
                  clearable
                  className="w-full"
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

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-2 text-lg font-bold">Eliminar Empleado</h2>
            <p className="mb-4 text-sm text-gray-600">
              ¿Eliminar a <strong>{deleteTarget.nombre}</strong>? Esta acción no
              se puede deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancelar
              </Button>
              <Button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
