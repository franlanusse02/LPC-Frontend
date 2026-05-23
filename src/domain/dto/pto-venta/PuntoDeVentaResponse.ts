import type { CierreCajaResponse } from "../cierre-caja/CierreCajaResponse";

export type PuntoDeVentaResponse = {
  id: number;
  nombre: string;
  comedorId: number;
};

export type PuntoDeVentaDetailedResponse = {
  id: number;
  nombre: string;
  comedorId: number;
  cierres: CierreCajaResponse[] | null;
};
