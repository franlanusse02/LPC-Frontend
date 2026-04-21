import type { MedioPago } from "@/domain/enums/MedioPago";

export type PatchImportRowFacturaRequest = {
  version: number;
  proveedorId?: number | null;
  comedorId?: number | null;
  bancoId?: number | null;
  medioPago?: MedioPago | null;
  fechaCarga?: string | null;
  fechaEmision?: string | null;
  fechaPago?: string | null;
  fechaFactura?: string | null;
  numeroFactura?: string | null;
  monto?: number | null;
  numeroOperacion?: string | null;
};
