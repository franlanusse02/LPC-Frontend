import { MedioPago } from "@/models/enums/MedioPago";

export type CreateMovimientoRequest = {
    monto: number;
    medioPago: MedioPago;
    cierreCajaId: number;
    comentarios: string | null;
}