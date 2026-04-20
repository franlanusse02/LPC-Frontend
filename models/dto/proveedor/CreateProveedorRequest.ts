import { MedioPago } from "@/models/enums/MedioPago";

export type CreateProveedorRequest = {
  nombre: string;
  taxId: string;
  formaDePagoPredeterminada?: MedioPago | null;
  puntosDeVenta: number[];
};
