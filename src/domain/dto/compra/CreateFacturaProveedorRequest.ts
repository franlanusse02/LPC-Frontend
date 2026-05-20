import type { MedioPago } from "@/domain/enums/MedioPago";
import type { FacturaPuntoDeVentaMontoRequest } from "@/domain/dto/compra/FacturaPuntoDeVentaMontoRequest";

export type CreateFacturaProveedorRequest = {
  numero: string;
  proveedorId: number;
  comedorId: number;
  fechaFactura: string;
  monto: number;
  comentarios?: string;
  puntoDeVentaProveedor?: number | null;
  puntoDeVentaComedor: FacturaPuntoDeVentaMontoRequest[];
  numeroOperacion?: string;
  medioPago?: MedioPago | null;
  bancoId?: number | null;
};
