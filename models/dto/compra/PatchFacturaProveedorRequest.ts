import { MedioPago } from "@/models/enums/MedioPago";

export type PatchFacturaProveedorRequest = {
    puntoDeVentaProveedor?: number | null;
    puntoDeVentaComedor?: Record<string, number>;
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
