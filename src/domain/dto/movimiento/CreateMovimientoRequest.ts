import type { MedioPago } from "@/domain/enums/MedioPago";

export type CreateMovimientoRequest = {
    monto: number;
    medioPago: MedioPago;
    cierreCajaId: number;
    comentarios: string | null;
}