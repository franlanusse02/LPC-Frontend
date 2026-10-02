import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, FileText, Paperclip, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Spinner } from "@/components/ui/spinner";
import { DataTable, SortableTh } from "@/components/data-table";
import { ConfirmDialog } from "@/modules/compras/components/ConfirmDialog";
import { useApi } from "@/hooks/useApi";
import { downloadPdf } from "@/lib/download";
import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";
import type { LegajoResponse } from "@/domain/dto/legajo/LegajoResponse";
import type { LegajoRequest } from "@/domain/dto/legajo/LegajoRequest";
import type { PatchLegajoRequest } from "@/domain/dto/legajo/PatchLegajoRequest";

type SortKey = "taxId" | "nombre" | "comedorNombre";

const CUIL_LENGTH = 11;
const MAX_FILE_MB = 20;

function extension(path: string) {
  const file = path.split("/").pop() ?? "";
  const dot = file.lastIndexOf(".");
  return dot > 0 ? file.slice(dot) : "";
}

export default function LegajosPage() {
  const navigate = useNavigate();
  const { get, post, patch, del, postFile } = useApi();

  const [legajos, setLegajos] = useState<LegajoResponse[] | null>(null);
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const loading = legajos === null;
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LegajoResponse | null>(null);
  const [deleting, setDeleting] = useState<LegajoResponse | null>(null);
  const [archivosDe, setArchivosDe] = useState<LegajoResponse | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("nombre");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [taxId, setTaxId] = useState("");
  const [nombre, setNombre] = useState("");
  const [comedorId, setComedorId] = useState("");

  const [archivoNombre, setArchivoNombre] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      get("/legajos").then((r) => r.json()),
      get("/comedores").then((r) => r.json()),
    ]).then(([legajosData, comedoresData]) => {
      setLegajos(legajosData);
      setComedores(comedoresData);
    });
  }, [get]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = [...(legajos ?? [])].sort((a, b) => {
    const av = String(a[sortKey] ?? "");
    const bv = String(b[sortKey] ?? "");
    return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const reemplazar = (saved: LegajoResponse) => {
    setLegajos((prev) => [...(prev ?? []).filter((l) => l.id !== saved.id), saved]);
    setArchivosDe((actual) => (actual?.id === saved.id ? saved : actual));
  };

  const openCreate = () => {
    setEditing(null);
    setTaxId("");
    setNombre("");
    setComedorId("");
    setModalOpen(true);
  };

  const openEdit = (l: LegajoResponse) => {
    setEditing(l);
    setTaxId(String(l.taxId));
    setNombre(l.nombre);
    setComedorId(l.comedorId !== null ? String(l.comedorId) : "");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (taxId.length !== CUIL_LENGTH || !nombre.trim()) {
      toast.error("Completá el CUIL (11 dígitos) y el nombre.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const body: PatchLegajoRequest = {
          ...(Number(taxId) !== editing.taxId ? { taxId: Number(taxId) } : {}),
          nombre: nombre.trim(),
          ...(comedorId ? { comedorId: Number(comedorId) } : {}),
        };
        reemplazar((await (await patch(`/legajos/${editing.id}`, body)).json()) as LegajoResponse);
        toast.success("Legajo actualizado");
      } else {
        const body: LegajoRequest = {
          taxId: Number(taxId),
          nombre: nombre.trim(),
          comedorId: comedorId ? Number(comedorId) : null,
        };
        const res = await post("/legajos", body);
        reemplazar((await res.json()) as LegajoResponse);
        // 200 = this cuil belonged to a deleted legajo, which came back with its files.
        toast.success(res.status === 200 ? "Legajo reactivado" : "Legajo creado");
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el legajo.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await del(`/legajos/${deleting.id}`);
      setLegajos((prev) => (prev ?? []).filter((l) => l.id !== deleting.id));
      toast.success(deleting.usuarioId ? "Legajo y usuario eliminados" : "Legajo eliminado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar el legajo.");
      throw err;
    }
  };

  const openArchivos = (l: LegajoResponse) => {
    setArchivosDe(l);
    setArchivoNombre("");
    setArchivo(null);
  };

  const handleSubir = async () => {
    if (!archivosDe || !archivo || !archivoNombre.trim()) {
      toast.error("Elegí un archivo y poné un nombre.");
      return;
    }
    if (archivo.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`El archivo supera los ${MAX_FILE_MB} MB.`);
      return;
    }
    setSubiendo(true);
    try {
      const form = new FormData();
      form.append("nombre", archivoNombre.trim());
      form.append("file", archivo);
      const res = await postFile(`/legajos/${archivosDe.id}/archivos`, form);
      reemplazar((await res.json()) as LegajoResponse);
      toast.success("Archivo subido");
      setArchivoNombre("");
      setArchivo(null);
      if (fileInput.current) fileInput.current.value = "";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo subir el archivo.");
    } finally {
      setSubiendo(false);
    }
  };

  const handleDescargar = async (l: LegajoResponse, nombreArchivo: string) => {
    try {
      await downloadPdf(
        get,
        `/legajos/${l.id}/archivos/contenido?nombre=${encodeURIComponent(nombreArchivo)}`,
        nombreArchivo + extension(l.archivos[nombreArchivo]),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo descargar el archivo.");
    }
  };

  const handleQuitar = async (l: LegajoResponse, nombreArchivo: string) => {
    try {
      const res = await del(`/legajos/${l.id}/archivos?nombre=${encodeURIComponent(nombreArchivo)}`);
      reemplazar((await res.json()) as LegajoResponse);
      toast.success("Archivo eliminado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar el archivo.");
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
                Legajos
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Las personas: CUIL, nombre, comedor y archivos. Los usuarios se crean a partir de un legajo.
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
                  col="taxId"
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
                  label="Comedor"
                  col="comedorNombre"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500 w-28">
                  Usuario
                </th>
                <th className="px-4 py-3 w-36" />
              </>
            }
            rows={sorted.map((l) => (
              <tr key={l.id} className="border-b hover:bg-gray-50/60">
                <td className="px-6 py-4 font-mono text-xs tracking-wider text-gray-500">
                  {l.taxId}
                </td>
                <td className="px-6 py-4 font-medium">{l.nombre}</td>
                <td className="px-6 py-4">
                  {l.comedorNombre ?? (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                      Sin asignar
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {l.usuarioId !== null ? "Sí" : "No"}
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 px-2 text-gray-600"
                    onClick={() => openArchivos(l)}
                  >
                    <Paperclip className="h-4 w-4" />
                    {Object.keys(l.archivos).length}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(l)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600"
                    onClick={() => setDeleting(l)}
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
              {editing ? "Editar" : "Nuevo"} Legajo
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">CUIL</label>
                <Input
                  value={taxId}
                  onChange={(e) =>
                    setTaxId(e.target.value.replace(/\D/g, "").slice(0, CUIL_LENGTH))
                  }
                  placeholder="11 dígitos"
                  inputMode="numeric"
                  className="font-mono"
                  autoFocus={!editing}
                />
                <p className="mt-1 text-xs text-gray-400">
                  {taxId.length}/{CUIL_LENGTH} dígitos
                  {editing?.usuarioId != null && " · cambia también el CUIL con el que ingresa su usuario"}
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
                <label className="mb-1 block text-sm font-medium">Comedor</label>
                <Combobox
                  options={comedores.map((c) => ({ value: String(c.id), label: c.nombre }))}
                  value={comedorId}
                  onChange={setComedorId}
                  placeholder="Sin asignar"
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

      {archivosDe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">Archivos</h2>
            <p className="mb-4 text-sm text-gray-500">{archivosDe.nombre}</p>

            <ul className="mb-4 divide-y rounded-md border">
              {Object.keys(archivosDe.archivos).length === 0 && (
                <li className="px-3 py-3 text-sm text-gray-400">Sin archivos todavía.</li>
              )}
              {Object.keys(archivosDe.archivos)
                .sort((a, b) => a.localeCompare(b))
                .map((n) => (
                  <li key={n} className="flex items-center justify-between gap-2 px-3 py-2">
                    <span className="flex min-w-0 items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                      <span className="truncate">{n}</span>
                    </span>
                    <span className="flex shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDescargar(archivosDe, n)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => handleQuitar(archivosDe, n)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </span>
                  </li>
                ))}
            </ul>

            <div className="space-y-2 rounded-md bg-gray-50 p-3">
              <Input
                value={archivoNombre}
                onChange={(e) => setArchivoNombre(e.target.value)}
                placeholder="Nombre (ej. DNI, Contrato)"
              />
              <input
                ref={fileInput}
                type="file"
                className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium"
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-gray-400">
                Máximo {MAX_FILE_MB} MB. Si el nombre ya existe, se reemplaza el archivo.
              </p>
              <div className="flex justify-end">
                <Button size="sm" onClick={handleSubir} disabled={subiendo} className="gap-2">
                  {subiendo ? <Spinner className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                  Subir
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setArchivosDe(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Eliminar legajo"
        description={
          <>
            Se elimina el legajo de <strong>{deleting?.nombre}</strong>
            {deleting?.usuarioId != null && " y también su usuario, que no va a poder ingresar más"}. El historial se
            conserva; si se vuelve a crear un legajo con el mismo CUIL, se reactiva este.
          </>
        }
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
      />
    </div>
  );
}
