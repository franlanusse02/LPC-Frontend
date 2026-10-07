import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { DataTable } from "@/components/data-table";
import { useApi } from "@/hooks/useApi";
import type {
  ConceptoCajaChicaResponse,
  CreateConceptoCajaChicaRequest,
  PatchConceptoCajaChicaRequest,
} from "@/domain/dto/caja-chica/ConceptoCajaChica";

// Conceptos are never deleted: deactivating keeps old movimientos labelled.
export default function ConceptosCajaChicaPage() {
  const navigate = useNavigate();
  const { get, post, patch } = useApi();

  const [conceptos, setConceptos] = useState<ConceptoCajaChicaResponse[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ConceptoCajaChicaResponse | null>(null);
  const [nombre, setNombre] = useState("");
  const [requiereDetalle, setRequiereDetalle] = useState(false);
  const [activo, setActivo] = useState(true);

  useEffect(() => {
    get("/cajas-chicas/conceptos")
      .then((r) => r.json())
      .then(setConceptos);
  }, [get]);

  const reemplazar = (saved: ConceptoCajaChicaResponse) =>
    setConceptos((prev) =>
      [...(prev ?? []).filter((c) => c.id !== saved.id), saved].sort((a, b) =>
        a.nombre.localeCompare(b.nombre),
      ),
    );

  const openCreate = () => {
    setEditing(null);
    setNombre("");
    setRequiereDetalle(false);
    setActivo(true);
    setModalOpen(true);
  };

  const openEdit = (c: ConceptoCajaChicaResponse) => {
    setEditing(c);
    setNombre(c.nombre);
    setRequiereDetalle(c.requiereDetalle);
    setActivo(c.activo);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!nombre.trim()) {
      toast.error("Poné un nombre.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const body: PatchConceptoCajaChicaRequest = {
          nombre: nombre.trim(),
          requiereDetalle,
          activo,
        };
        reemplazar(await (await patch(`/cajas-chicas/conceptos/${editing.id}`, body)).json());
        toast.success("Concepto actualizado");
      } else {
        const body: CreateConceptoCajaChicaRequest = { nombre: nombre.trim(), requiereDetalle };
        reemplazar(await (await post("/cajas-chicas/conceptos", body)).json());
        toast.success("Concepto creado");
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el concepto.");
    } finally {
      setSaving(false);
    }
  };

  if (conceptos === null)
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );

  return (
    <div className="px-4 sm:px-8 lg:px-18 py-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
      </div>

      <Card className="mx-auto max-w-4xl border-0 shadow-md mt-4">
        <CardHeader className="border-b px-6 py-4">
          <div className="flex flex-row justify-between w-full">
            <CardTitle className="tracking-wide">
              <h1 className="text-xl font-bold text-gray-800 uppercase">Conceptos de Caja Chica</h1>
              <p className="text-sm text-gray-500 mt-1">
                Se usan para ingresos y egresos. Los que piden detalle obligan a escribir una
                descripción.
              </p>
            </CardTitle>
            <Button size="sm" onClick={openCreate} className="gap-2 font-bold">
              <Plus className="h-4 w-4" /> NUEVO
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            displayedCount={conceptos.length}
            columns={
              <>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500 w-40">
                  Pide detalle
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500 w-28">
                  Estado
                </th>
                <th className="px-4 py-3 w-16" />
              </>
            }
            rows={conceptos.map((c) => (
              <tr key={c.id} className="border-b hover:bg-gray-50/60">
                <td className={`px-6 py-4 font-medium ${c.activo ? "" : "text-gray-400"}`}>
                  {c.nombre}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{c.requiereDetalle ? "Sí" : "No"}</td>
                <td className="px-6 py-4">
                  {c.activo ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                      Inactivo
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(c)}
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
            <h2 className="mb-4 text-lg font-bold">{editing ? "Editar" : "Nuevo"} Concepto</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Nombre</label>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Insumos de limpieza"
                  autoFocus
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={requiereDetalle}
                  onChange={(e) => setRequiereDetalle(e.target.checked)}
                />
                Pide detalle obligatorio
              </label>
              {editing && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                  />
                  Activo (los inactivos no se pueden elegir en movimientos nuevos)
                </label>
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
