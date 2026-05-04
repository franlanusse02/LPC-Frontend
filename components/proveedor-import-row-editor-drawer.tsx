"use client";

import { useEffect, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediosPagoDict } from "@/models/enums/MedioPago";
import { AssignmentBadge } from "@/components/assignment-badge";
import { RowStatusBadge } from "@/components/row-status-badge";
import { ImportRowProveedorResponse } from "@/models/dto/imports/proveedores/ImportRowProveedorResponse";
import { PatchImportRowProveedorRequest } from "@/models/dto/imports/proveedores/PatchImportRowProveedorRequest";
import { Trash2 } from "lucide-react";

type ProveedorImportRowEditorDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: ImportRowProveedorResponse | null;
  isMine: boolean;
  jobClosed?: boolean;
  submitting: boolean;
  onSave: (payload: PatchImportRowProveedorRequest) => Promise<void>;
  onRevalidate: () => Promise<void>;
  onApply: () => Promise<void>;
  onDelete: () => Promise<void>;
};

type FormState = {
  nombre: string;
  taxId: string;
  formaDePagoPredeterminada: string;
  puntosDeVenta: string;
};

const emptyForm: FormState = {
  nombre: "",
  taxId: "",
  formaDePagoPredeterminada: "",
  puntosDeVenta: "",
};

export function ProveedorImportRowEditorDrawer({
  open,
  onOpenChange,
  row,
  isMine,
  jobClosed = false,
  submitting,
  onSave,
  onRevalidate,
  onApply,
  onDelete,
}: ProveedorImportRowEditorDrawerProps) {
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (!row) {
      setForm(emptyForm);
      return;
    }
    setForm({
      nombre: row.nombre ?? "",
      taxId: row.taxId ?? "",
      formaDePagoPredeterminada: row.formaDePagoPredeterminada ?? "",
      puntosDeVenta: row.puntosDeVenta ?? "",
    });
  }, [row]);

  if (!row) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload: PatchImportRowProveedorRequest = {
      version: row.version,
      nombre: form.nombre.trim() || null,
      taxId: form.taxId.trim() || null,
      formaDePagoPredeterminada: form.formaDePagoPredeterminada || null,
      puntosDeVenta: form.puntosDeVenta.trim() || null,
    };
    await onSave(payload);
  };

  const canDelete = row.estado === "INVALID" || row.estado === "CONFLICT";

  return (
    <Drawer direction="left" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="w-full sm:w-[34rem] sm:max-w-[34rem]">
        <DrawerHeader className="border-b border-gray-200">
          <div className="flex items-center gap-2">
            <DrawerTitle>Fila {row.rowIndex}</DrawerTitle>
            <RowStatusBadge estado={row.estado} />
          </div>
          <DrawerDescription>Corrección manual de proveedor importado</DrawerDescription>
          <div className="pt-2">
            <AssignmentBadge
              estadoAsignacion={row.estadoAsignacion}
              asignadoANombre={row.asignadoANombre}
              mine={isMine}
            />
          </div>
        </DrawerHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          {row.errors && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm whitespace-pre-line text-rose-700">
              {row.errors}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input
                value={form.nombre}
                onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
                disabled={!isMine || jobClosed}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Tax ID</Label>
              <Input
                value={form.taxId}
                onChange={(event) => setForm((prev) => ({ ...prev, taxId: event.target.value }))}
                disabled={!isMine || jobClosed}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Forma de pago predeterminada</Label>
              <Select
                value={form.formaDePagoPredeterminada}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, formaDePagoPredeterminada: v === "__none__" ? "" : v }))
                }
                disabled={!isMine || jobClosed}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin predeterminado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin predeterminado</SelectItem>
                  {Object.entries(MediosPagoDict).map(([label, value]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Puntos de venta</Label>
              <Input
                value={form.puntosDeVenta}
                onChange={(event) => setForm((prev) => ({ ...prev, puntosDeVenta: event.target.value }))}
                disabled={!isMine || jobClosed}
                placeholder="Ej: 1001, 1002"
              />
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
