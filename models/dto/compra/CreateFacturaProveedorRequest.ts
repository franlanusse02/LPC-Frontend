import { MedioPago } from "@/models/enums/MedioPago";
import { FacturaPuntoDeVentaMonto } from "@/models/dto/compra/FacturaPuntoDeVentaMonto";

export type CreateFacturaProveedorRequest = {
  numero: string;
  proveedorId: number;
  comedorId: number;
  fechaFactura: string;
  monto: number;
  comentarios?: string;
  puntoDeVentaProveedor?: number | null;
  puntoDeVentaComedor: FacturaPuntoDeVentaMonto[];
  numeroOperacion?: string;
  medioPago?: MedioPago | null;
  bancoId?: number | null;
};
