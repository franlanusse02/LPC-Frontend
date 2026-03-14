export type CierreCajaResponse = {
    id: number;
    puntoDeVentaId: number;
    fechaOperacion: string;
    creadoPorId: number;
    totalPlatosVendidos: number;
    createdAt: string;
    comentarios: string | null;
    anulacionId: number | null;
    movimientosIds: number[] | null;
}