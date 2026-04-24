import { MedioPago } from "@/models/enums/MedioPago";

export type CreateFacturaProveedorRequest = {
  numero: string;
  proveedorId: number;
  comedorId: number;
  fechaFactura: string;
  monto: number;
  comentarios?: string;
  puntoDeVentaProveedor?: number | null;
  puntoDeVentaComedor: Record<string, number>;
  numeroOperacion?: string;
  medioPago?: MedioPago | null;
  bancoId?: number | null;
};
