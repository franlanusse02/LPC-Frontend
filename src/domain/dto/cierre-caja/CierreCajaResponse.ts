import type { UsuarioResponse } from "@/domain/dto/auth/UsuarioResponse";
import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";
import type { MovimientoResponse } from "@/domain/dto/movimiento/MovimientoResponse";
import type { PuntoDeVentaResponse } from "@/domain/dto/pto-venta/PuntoDeVentaResponse";

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
