import { MedioPago } from "@/models/enums/MedioPago";

export type MovimientoResponse = {
    id: number;
    monto: number;
    medioPago: MedioPago;
    fechaHora: string;
    cierreCajaId: number;
    anulacionId: number | null;
    comentarios: string | null;
}