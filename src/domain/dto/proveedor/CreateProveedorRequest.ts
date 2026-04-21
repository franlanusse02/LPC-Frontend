import type { MedioPago } from "@/domain/enums/MedioPago";

export type CreateProveedorRequest = {
  nombre: string;
  taxId: string;
  formaDePagoPredeterminada?: MedioPago | null;
  puntosDeVenta: number[];
};
