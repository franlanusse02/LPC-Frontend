import { PuntoDeVentaResponse } from "../pto-venta/PuntoDeVentaResponse";

export type ComedorResponse = {
    id: number;
    nombre: string;
    puntosDeVenta: PuntoDeVentaResponse[] | null;
}