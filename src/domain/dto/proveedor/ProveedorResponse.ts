import type { MedioPago } from "@/domain/enums/MedioPago";

export type ProveedorResponse = {
  id: number;
  nombre: string;
  taxId: string;
  formaDePagoPredeterminada: MedioPago | null;
  puntosDeVenta: number[];
};
