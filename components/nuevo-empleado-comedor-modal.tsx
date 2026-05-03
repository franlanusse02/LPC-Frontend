"use client";

import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { UserPlus } from "lucide-react";
import { FormField } from "./form-field";
import { Combobox } from "@/components/ui/combobox";
import { ComedorResponse } from "@/models/dto/comedor/ComedorResponse";
import { CreateEmpleadoComedorRequest } from "@/models/dto/empleado/CreateEmpleadoComedorRequest";

interface NuevoEmpleadoComedorModalProps {
  open: boolean;
  onClose: () => void;
  comedores: ComedorResponse[];
  onConfirm: (req: CreateEmpleadoComedorRequest) => Promise<void>;
}

export function NuevoEmpleadoComedorModal({ open, onClose, comedores, onConfirm }: NuevoEmpleadoComedorModalProps) {
  const [loading, setLoading] = useState(false);
  const [comedorId, setComedorId] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [taxId, setTaxId] = useState("");

  useEffect(() => {
    if (!open) {
      setComedorId("");
      setNombre("");
      setEmail("");
      setTaxId("");
    }
  }, [open]);

  const canSubmit = !!comedorId && nombre.trim().length > 0;

  const handleConfirm = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await onConfirm({
        comedorId: Number(comedorId),
        nombre: nombre.trim(),
        email: email.trim() || null,
        taxId: taxId.trim() ? Number(taxId) : null,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const comedorOptions = comedores.map((c) => ({ value: String(c.id), label: c.nombre }));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md shadow-xl border-0 p-0 overflow-hidden">
        <div className="h-1.5 w-full bg-primary" />
        <div className="px-6 pt-5 pb-6 space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserPlus className="h-5 w-5" />
              </span>
              <DialogTitle className="text-lg font-bold text-gray-900">
                Nuevo empleado
              </DialogTitle>
            </div>
          </DialogHeader>

          <FormField label="Comedor *">
            <Combobox
              options={comedorOptions}
              value={comedorId}
              onChange={setComedorId}
              placeholder="Seleccionar comedor..."
              searchPlaceholder="Buscar comedor..."
              className="bg-card"
            />
          </FormField>

          <FormField label="Nombre *">
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre completo"
              className="bg-card"
            />
          </FormField>

          <FormField label="Email (opcional)">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@empresa.com"
              className="bg-card"
            />
          </FormField>

          <FormField label="DNI (opcional)">
            <Input
              value={taxId}
              onChange={(e) => setTaxId(e.target.value.replace(/\D/g, ""))}
              placeholder="20123456789"
              className="bg-card"
            />
          </FormField>

          <DialogFooter className="flex-row justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={loading}
              className="rounded-lg border-gray-200 text-gray-600 hover:bg-gray-50">
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={loading || !canSubmit}
              className="rounded-lg font-semibold">
              {loading ? <><Spinner className="mr-2 h-4 w-4" />Creando...</> : "Crear empleado"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
