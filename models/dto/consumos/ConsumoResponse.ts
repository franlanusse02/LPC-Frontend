import { AnulacionConsumoResponse } from "./AnulacionConsumoResponse";
import { ProductoConsumoResponse } from "./ProductoConsumoResponse";

export type ConsumoResponse = {
  id: number;
  PuntoDeVentaId: number;
  fecha: string;
  consumidorId: number;
  anulacion: AnulacionConsumoResponse | null;
  observaciones: string | null;
  total: number;
  productos: ProductoConsumoResponse[];
  creadoEn: string;
  actualizadoEn: string | null;
};
