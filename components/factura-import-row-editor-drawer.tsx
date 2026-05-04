"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImportRowFacturaResponse } from "@/models/dto/imports/facturas/ImportRowFacturaResponse";
import { PatchImportRowFacturaRequest } from "@/models/dto/imports/facturas/PatchImportRowFacturaRequest";
import { ProveedorResponse } from "@/models/dto/proveedor/ProveedorResponse";
import { ComedorResponse } from "@/models/dto/comedor/ComedorResponse";
import { BancoResponse } from "@/models/dto/banco/BancoResponse";
import { DatePickerInput } from "@/components/date-picker-input";
import { MedioPago, MediosPagoDict } from "@/models/enums/MedioPago";
import { AssignmentBadge } from "@/components/assignment-badge";
import { RowStatusBadge } from "@/components/row-status-badge";
import { Trash2 } from "lucide-react";

type FacturaImportRowEditorDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: ImportRowFacturaResponse | null;
  proveedores: ProveedorResponse[];
  comedores: ComedorResponse[];
  bancos: BancoResponse[];
  isMine: boolean;
  jobClosed?: boolean;
  submitting: boolean;
  onSave: (payload: PatchImportRowFacturaRequest) => Promise<void>;
  onRevalidate: () => Promise<void>;
  onApply: () => Promise<void>;
  onDelete: () => Promise<void>;
};

type FormState = {
  proveedorId: string;
  comedorId: string;
  bancoId: string;
  medioPago: string;
  fechaCarga: string;
  fechaEmision: string;
  fechaPago: string;
  fechaFactura: string;
  numeroFactura: string;
  monto: string;
  numeroOperacion: string;
};

const emptyForm: FormState = {
  proveedorId: "",
  comedorId: "",
  bancoId: "",
  medioPago: "",
  fechaCarga: "",
  fechaEmision: "",
  fechaPago: "",
  fechaFactura: "",
  numeroFactura: "",
  monto: "",
  numeroOperacion: "",
};

export function FacturaImportRowEditorDrawer({
  open,
  onOpenChange,
  row,
  proveedores,
  comedores,
  bancos,
  isMine,
  jobClosed = false,
  submitting,
  onSave,
  onRevalidate,
  onApply,
  onDelete,
}: FacturaImportRowEditorDrawerProps) {
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (!row) {
      setForm(emptyForm);
      return;
    }
    setForm({
      proveedorId: row.proveedorId != null ? String(row.proveedorId) : "",
      comedorId: row.comedorId != null ? String(row.comedorId) : "",
      bancoId: row.bancoId != null ? String(row.bancoId) : "",
      medioPago: row.medioPago ?? "",
      fechaCarga: row.fechaCarga ?? "",
      fechaEmision: row.fechaEmision ?? "",
      fechaPago: row.fechaPago ?? "",
      fechaFactura: row.fechaFactura ?? "",
      numeroFactura: row.numeroFactura ?? "",
      monto: row.monto != null ? String(row.monto) : "",
      numeroOperacion: row.numeroOperacion ?? "",
    });
  }, [row]);

  const bancosOptions = useMemo(
    () => bancos.map((banco) => ({ value: String(banco.id), label: `${banco.nombre} (${banco.sociedadNombre})` })),
    [bancos]
  );

  if (!row) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload: PatchImportRowFacturaRequest = {
      version: row.version,
      proveedorId: form.proveedorId ? Number(form.proveedorId) : null,
      comedorId: form.comedorId ? Number(form.comedorId) : null,
      bancoId: form.bancoId ? Number(form.bancoId) : null,
      medioPago: form.medioPago ? (form.medioPago as MedioPago) : null,
      fechaCarga: form.fechaCarga || null,
      fechaEmision: form.fechaEmision || null,
      fechaPago: form.fechaPago || null,
      fechaFactura: form.fechaFactura || null,
      numeroFactura: form.numeroFactura.trim() || null,
      monto: form.monto ? Number(form.monto) : null,
      numeroOperacion: form.numeroOperacion.trim() || null,
    };
    await onSave(payload);
  };

  const canDelete = row.estado === "INVALID" || row.estado === "CONFLICT";

  return (
    <Drawer direction="left" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="w-full sm:w-[40rem] sm:max-w-[40rem]">
        <DrawerHeader className="border-b border-gray-200">
          <div className="flex items-center gap-2">
            <DrawerTitle>Fila {row.rowIndex}</DrawerTitle>
            <RowStatusBadge estado={row.estado} />
          </div>
          <DrawerDescription>
            {row.excelId ? `Excel ID: ${row.excelId}` : "Resolución manual de fila importada"}
          </DrawerDescription>
          <div className="pt-2">
            <AssignmentBadge
              estadoAsignacion={row.estadoAsignacion}
              asignadoANombre={row.asignadoANombre}
              mine={isMine}
            />
          </div>
        </DrawerHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          <section className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-800">Valores del Excel</h3>
            <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
              <div><span className="font-medium text-gray-800">Fecha carga:</span> {row.fechaCargaRaw || "—"}</div>
              <div><span className="font-medium text-gray-800">Fecha factura:</span> {row.fechaFacturaRaw || "—"}</div>
              <div><span className="font-medium text-gray-800">Fecha emisión:</span> {row.fechaEmisionRaw || "—"}</div>
              <div><span className="font-medium text-gray-800">Fecha pago:</span> {row.fechaPagoRaw || "—"}</div>
              <div><span className="font-medium text-gray-800">Monto:</span> {row.montoRaw || "—"}</div>
              <div><span className="font-medium text-gray-800">Forma pago:</span> {row.formaPagoRaw || "—"}</div>
              <div className="col-span-2"><span className="font-medium text-gray-800">Banco pagador:</span> {row.bancoPagadorRaw || "—"}</div>
              {row.errors && (
                <div className="col-span-2 rounded-lg border border-rose-200 bg-rose-50 p-3 whitespace-pre-line text-rose-700">
                  {row.errors}
                </div>
              )}
            </div>
          </section>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Proveedor</Label>
                <select
                  value={form.proveedorId}
                  onChange={(event) => setForm((prev) => ({ ...prev, proveedorId: event.target.value }))}
                  disabled={!isMine || jobClosed}
                  className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm disabled:bg-gray-100"
                >
                  <option value="">Seleccionar proveedor</option>
                  {proveedores.map((proveedor) => (
                    <option key={proveedor.id} value={proveedor.id}>
                      {proveedor.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Comedor</Label>
                <select
                  value={form.comedorId}
                  onChange={(event) => setForm((prev) => ({ ...prev, comedorId: event.target.value }))}
                  disabled={!isMine || jobClosed}
                  className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm disabled:bg-gray-100"
                >
                  <option value="">Seleccionar comedor</option>
                  {comedores.map((comedor) => (
                    <option key={comedor.id} value={comedor.id}>
                      {comedor.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Banco</Label>
                <select
                  value={form.bancoId}
                  onChange={(event) => setForm((prev) => ({ ...prev, bancoId: event.target.value }))}
                  disabled={!isMine || jobClosed}
                  className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm disabled:bg-gray-100"
                >
                  <option value="">Seleccionar banco</option>
                  {bancosOptions.map((banco) => (
                    <option key={banco.value} value={banco.value}>
                      {banco.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Medio de pago</Label>
                <select
                  value={form.medioPago}
                  onChange={(event) => setForm((prev) => ({ ...prev, medioPago: event.target.value }))}
                  disabled={!isMine || jobClosed}
                  className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm disabled:bg-gray-100"
                >
                  <option value="">Seleccionar medio</option>
                  {Object.entries(MediosPagoDict).map(([label, value]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Fecha de carga</Label>
                <DatePickerInput
                  value={form.fechaCarga}
                  onChange={(value) => setForm((prev) => ({ ...prev, fechaCarga: value }))}
                  disabled={!isMine || jobClosed}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Fecha factura</Label>
                <DatePickerInput
                  value={form.fechaFactura}
                  onChange={(value) => setForm((prev) => ({ ...prev, fechaFactura: value }))}
                  disabled={!isMine || jobClosed}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Fecha emisión</Label>
                <DatePickerInput
                  value={form.fechaEmision}
                  onChange={(value) => setForm((prev) => ({ ...prev, fechaEmision: value }))}
                  disabled={!isMine || jobClosed}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Fecha pago</Label>
                <DatePickerInput
                  value={form.fechaPago}
                  onChange={(value) => setForm((prev) => ({ ...prev, fechaPago: value }))}
                  disabled={!isMine || jobClosed}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Número factura</Label>
                <Input
                  value={form.numeroFactura}
                  onChange={(event) => setForm((prev) => ({ ...prev, numeroFactura: event.target.value }))}
                  disabled={!isMine || jobClosed}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Monto</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.monto}
                  onChange={(event) => setForm((prev) => ({ ...prev, monto: event.target.value }))}
                  disabled={!isMine || jobClosed}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label>Número de operación</Label>
                <Input
                  value={form.numeroOperacion}
                  onChange={(event) => setForm((prev) => ({ ...prev, numeroOperacion: event.target.value }))}
                  disabled={!isMine}
                />
              </div>
            </div>

            {isMine && !jobClosed && (
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Guardando..." : "Guardar cambios"}
              </Button>
            )}
          </form>
        </div>

        {isMine && !jobClosed && (
          <DrawerFooter className="border-t border-gray-200 bg-white">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button variant="outline" onClick={onRevalidate} disabled={submitting}>
                Revalidar
              </Button>
              {canDelete && (
                <Button
                  variant="outline"
                  onClick={onDelete}
                  disabled={submitting}
                  className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>
              )}
              {!canDelete && (
                <Button onClick={onApply} disabled={submitting || row.estado !== "READY"}>
                  Aplicar
                </Button>
              )}
            </div>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
