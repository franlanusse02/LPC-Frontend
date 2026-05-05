import { MedioPago } from "@/models/enums/MedioPago";
import { FacturaPuntoDeVentaMonto } from "@/models/dto/compra/FacturaPuntoDeVentaMonto";

export type PatchFacturaProveedorRequest = {
    puntoDeVentaProveedor?: number | null;
    puntoDeVentaComedor?: FacturaPuntoDeVentaMonto[];
    comedorId?: number;
    fechaFactura?: string;
    numeroFactura?: string;
    monto?: number;
    comentarios?: string;
    numeroOperacion?: string;
    medioPago?: MedioPago | null;
    bancoId?: number | null;
    fechaEmision?: string | null;
    fechaPago?: string | null;
    proveedorId?: number;
};
