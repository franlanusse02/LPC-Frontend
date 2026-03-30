import { MedioPago } from "@/models/enums/MedioPago";

export type ProveedorResponse = {
  id: number;
  nombre: string;
  taxId: string;
  formaDePagoPredeterminada: MedioPago | null;
  puntosDeVenta: number[];
};
