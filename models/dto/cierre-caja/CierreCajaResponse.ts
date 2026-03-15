import { ComedorResponse } from "../comedor/ComedorResponse";
import { MovimientoResponse } from "../movimiento/MovimientoResponse";
import { PuntoDeVentaResponse } from "../pto-venta/PuntoDeVentaResponse";

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
  creadoPorId: number;
  totalPlatosVendidos: number;
  createdAt: string;
  comentarios: string | null;
  anulacionId: number | null;
  movimientos: MovimientoResponse[] | null;
  montoTotal: number;
};
