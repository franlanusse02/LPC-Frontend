import type {
  PuntoDeVentaResponse,
  PuntoDeVentaDetailedResponse,
} from "../pto-venta/PuntoDeVentaResponse";

export type ComedorResponse = {
  id: number;
  nombre: string;
  puntosDeVenta: PuntoDeVentaResponse[] | null;
  sociedadId: number;
};

export type ComedorDetailedResponse = ComedorResponse & {
  id: number;
  nombre: string;
  puntosDeVenta: PuntoDeVentaDetailedResponse[] | null;
};
