"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileSpreadsheet, Upload } from "lucide-react";

type UploadImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: "facturas" | "proveedores" | "consumidores" | "empleados-comedor";
  submitting: boolean;
  onSubmit: (file: File) => Promise<void>;
};

export function UploadImportDialog({
  open,
  onOpenChange,
  tipo,
  submitting,
  onSubmit,
}: UploadImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return;
    await onSubmit(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subir import de {tipo}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-white p-2 shadow-sm">
                <FileSpreadsheet className="h-5 w-5 text-gray-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-800">
                  Archivo Excel
                </p>
                <p className="text-xs text-gray-500">
                  Formatos soportados: `.xlsx` y `.xls`
                </p>
              </div>
            </div>
            <input
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="mt-4 block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-gray-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-gray-800"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>

          <Button type="submit" className="w-full gap-2" disabled={!file || submitting}>
            <Upload className="h-4 w-4" />
            {submitting ? "Subiendo..." : "Subir archivo"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
