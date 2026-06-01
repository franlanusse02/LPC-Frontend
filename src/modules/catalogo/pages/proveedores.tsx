import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Spinner } from "@/components/ui/spinner";
import { DataTable } from "@/components/data-table";
import { useApi } from "@/hooks/useApi";
import { MediosPagoDict } from "@/domain/enums/MedioPago";
import type { MedioPago } from "@/domain/enums/MedioPago";
import type { PuntoDeVentaResponse } from "@/domain/dto/pto-venta/PuntoDeVentaResponse";

export default function ProveedoresPage() {
  const navigate = useNavigate();
  const { get, post, patch } = useApi();

  const [proveedores, setProveedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const [nombre, setNombre] = useState("");
  const [taxId, setTaxId] = useState("");
  const [formaPago, setFormaPago] = useState<MedioPago | "">("");
  const [puntosDeVenta, setPuntosDeVenta] = useState<PuntoDeVentaResponse[]>([]);
  const [selectedPuntos, setSelectedPuntos] = useState<number[]>([]);

  useEffect(() => {
    Promise.all([
      get("/proveedores").then((r) => r.json()),
      get("/comedores/puntos-de-venta").then((r) => r.json()),
    ]).then(([proveedoresData, puntosData]) => {
      setProveedores(proveedoresData);
      setPuntosDeVenta(puntosData);
      setLoading(false);
    });
  }, [get]);

  const openCreate = () => { setEditing(null); setNombre(""); setTaxId(""); setFormaPago(""); setSelectedPuntos([]); setModalOpen(true); };
  const openEdit = (p: any) => { setEditing(p); setNombre(p.nombre); setTaxId(p.taxId); setFormaPago(p.formaDePagoPredeterminada ?? ""); setSelectedPuntos(p.puntosDeVenta ?? []); setModalOpen(true); };

  const handleSave = async () => {
    if (!nombre.trim() || !taxId.trim()) { toast.error("Completá la razón social y el CUIT."); return; }
    setSaving(true);
    try {
      const body = { nombre: nombre.trim(), taxId: taxId.trim(), formaDePagoPredeterminada: formaPago || null, puntosDeVenta: selectedPuntos };
      const res = editing
        ? await patch(`/proveedores/${editing.id}`, body)
        : await post("/proveedores", body);
      const saved = (await res.json());
      setProveedores((prev) => editing ? prev.map((p) => (p.id === saved.id ? saved : p)) : [...prev, saved]);
      toast.success(editing ? "Proveedor actualizado" : "Proveedor creado");
      setModalOpen(false);
    } catch (err) { toast.error(err instanceof Error ? err.message : "No se pudo guardar el proveedor."); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

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
              <h1 className="text-xl font-bold text-gray-800 uppercase">Proveedores</h1>
              <p className="text-sm text-gray-500 mt-1">Gestioná los proveedores del sistema</p>
            </CardTitle>
            <Button size="sm" onClick={openCreate} className="gap-2 font-bold">
              <Plus className="h-4 w-4" /> NUEVO
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            displayedCount={proveedores.length}
            columns={<><th className="px-6 py-3">Nombre</th><th className="px-6 py-3">CUIT</th><th className="px-6 py-3">Forma de Pago</th><th className="px-6 py-3">Puntos de Venta</th><th className="px-4 py-3 w-12" /></>}
            rows={proveedores.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50/60">
                <td className="px-6 py-4 font-medium">{p.nombre}</td>
                <td className="px-6 py-4 font-mono text-sm text-gray-600">{p.taxId}</td>
                <td className="px-6 py-4 text-gray-600">
                  {p.formaDePagoPredeterminada
                    ? Object.entries(MediosPagoDict).find(([, v]) => v === p.formaDePagoPredeterminada)?.[0] ?? p.formaDePagoPredeterminada
                    : "—"}
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm">
                  {(p.puntosDeVenta ?? []).length > 0
                    ? p.puntosDeVenta.map((pvId: number) => puntosDeVenta.find((pv) => pv.id === pvId)?.nombre ?? pvId).join(", ")
                    : "—"}
                </td>
                <td className="px-6 py-4 text-right"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button></td>
              </tr>
            ))}
          ></DataTable>
        </CardContent>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">{editing ? "Editar" : "Nuevo"} Proveedor</h2>
            <div className="space-y-4">
              <div><label className="mb-1 block text-sm font-medium">Nombre</label><Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del proveedor" autoFocus /></div>
              <div><label className="mb-1 block text-sm font-medium">CUIT</label><Input value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="CUIT" /></div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Forma de Pago{" "}
                  <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <Combobox
                  options={Object.entries(MediosPagoDict).map(([label, value]) => ({ value, label }))}
                  value={formaPago}
                  onChange={(v) => setFormaPago(v as MedioPago | "")}
                  placeholder="Seleccionar..."
                  className="w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Puntos de Venta{" "}
                  <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <div className="max-h-32 overflow-y-auto rounded-md border border-gray-200 p-2 space-y-1">
                  {puntosDeVenta.map((pv) => (
                    <label key={pv.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPuntos.includes(pv.id)}
                        onChange={(e) =>
                          setSelectedPuntos((prev) =>
                            e.target.checked
                              ? [...prev, pv.id]
                              : prev.filter((id) => id !== pv.id),
                          )
                        }
                        className="rounded border-gray-300"
                      />
                      {pv.nombre}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button><Button onClick={handleSave} disabled={saving}>{saving ? <><Spinner className="mr-2 h-4 w-4" />Guardando...</> : "Guardar"}</Button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
