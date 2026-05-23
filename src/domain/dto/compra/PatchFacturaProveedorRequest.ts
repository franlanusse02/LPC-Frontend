import type { MedioPago } from "@/domain/enums/MedioPago";
import type { FacturaPuntoDeVentaMontoRequest } from "@/domain/dto/compra/FacturaPuntoDeVentaMontoRequest";

export type PatchFacturaProveedorRequest = {
    puntoDeVentaProveedor?: number | null;
    puntoDeVentaComedor?: FacturaPuntoDeVentaMontoRequest[];
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
