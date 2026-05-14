import type { MedioPago } from "@/domain/enums/MedioPago";
import type { FacturaProveedorMontoRequest } from "@/domain/dto/compra/FacturaProveedorMontoRequest";

export type PatchFacturaProveedorRequest = {
    puntoDeVentaProveedor?: number | null;
    puntoDeVentaComedor?: FacturaProveedorMontoRequest[];
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
