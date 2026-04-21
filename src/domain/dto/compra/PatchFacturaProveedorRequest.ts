import type { MedioPago } from "@/domain/enums/MedioPago";

export type PatchFacturaProveedorRequest = {
    puntoDeVenta?: number | null;
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
