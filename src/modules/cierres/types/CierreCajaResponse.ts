import type { MovimientoResponse } from "./MovimientoResponse";

export type ComedorResponse = {
  id: number;
  nombre: string;
  sociedad: string;
};

export type PuntoDeVentaResponse = {
  id: number;
  nombre: string;
};

export type UsuarioResponse = {
  cuil: string;
  nombre: string;
};

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
  montoTotal: number;
};

export type DetailedCierreCajaResponse = {
  id: number;
  comedor: ComedorResponse;
  puntoDeVenta: PuntoDeVentaResponse;
  fechaOperacion: string;
  creadoPor: UsuarioResponse;
  totalPlatosVendidos: number;
  createdAt: string;
  comentarios: string | null;
  anulacionId: number | null;
  movimientos: MovimientoResponse[] | null;
  montoTotal: number;
};
