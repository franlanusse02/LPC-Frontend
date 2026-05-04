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
import { AssignmentBadge } from "@/components/assignment-badge";
import { RowStatusBadge } from "@/components/row-status-badge";
import { Trash2 } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { ComedorResponse } from "@/models/dto/comedor/ComedorResponse";
import { ImportRowEmpleadoResponse } from "@/models/dto/imports/empleados/ImportRowEmpleadoResponse";
import { PatchImportRowEmpleadoRequest } from "@/models/dto/imports/empleados/PatchImportRowEmpleadoRequest";

type EmpleadoImportRowEditorDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: ImportRowEmpleadoResponse | null;
  comedores: ComedorResponse[];
  isMine: boolean;
  jobClosed?: boolean;
  submitting: boolean;
  onSave: (payload: PatchImportRowEmpleadoRequest) => Promise<void>;
  onRevalidate: () => Promise<void>;
  onApply: () => Promise<void>;
  onDelete: () => Promise<void>;
};

type FormState = {
  comedorId: string;
  nombre: string;
  email: string;
  taxId: string;
};

const emptyForm: FormState = {
  comedorId: "",
  nombre: "",
  email: "",
  taxId: "",
};

export function EmpleadoImportRowEditorDrawer({
  open,
  onOpenChange,
  row,
  comedores,
  isMine,
  jobClosed = false,
  submitting,
  onSave,
  onRevalidate,
  onApply,
  onDelete,
}: EmpleadoImportRowEditorDrawerProps) {
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (!row) {
      setForm(emptyForm);
      return;
    }
    setForm({
      comedorId: row.comedorId != null ? String(row.comedorId) : "",
      nombre: row.nombre ?? "",
      email: row.email ?? "",
      taxId: row.taxId ?? "",
    });
  }, [row]);

  const comedorOptions = useMemo(
    () => comedores.map((comedor) => ({ value: String(comedor.id), label: comedor.nombre })),
    [comedores],
  );

  if (!row) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload: PatchImportRowEmpleadoRequest = {
      version: row.version,
      comedorId: form.comedorId ? Number(form.comedorId) : null,
      nombre: form.nombre.trim() || null,
      email: form.email.trim() || null,
      taxId: form.taxId.trim() || null,
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
          <DrawerDescription>Corrección manual de empleado importado</DrawerDescription>
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
              <Label>Comedor</Label>
              <Combobox
                options={comedorOptions}
                value={form.comedorId}
                onChange={(value) => setForm((prev) => ({ ...prev, comedorId: value }))}
                placeholder="Seleccionar comedor"
                searchPlaceholder="Buscar comedor..."
                disabled={!isMine || jobClosed}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input
                value={form.nombre}
                onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
                disabled={!isMine || jobClosed}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
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
              {canDelete ? (
                <Button
                  variant="outline"
                  onClick={onDelete}
                  disabled={submitting}
                  className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>
              ) : (
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
