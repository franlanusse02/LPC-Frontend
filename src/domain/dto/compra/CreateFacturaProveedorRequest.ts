import type { MedioPago } from "@/domain/enums/MedioPago";

export type CreateFacturaProveedorRequest = {
  numero: string;
  proveedorId: number;
  comedorId: number;
  fechaFactura: string;
  monto: number;
  comentarios?: string;
  puntoDeVenta?: number | null;
  numeroOperacion?: string;
  medioPago?: MedioPago | null;
  bancoId?: number | null;
};
