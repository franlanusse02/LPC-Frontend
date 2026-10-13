import type { TipoMovimientoCajaChica } from "@/domain/enums/TipoMovimientoCajaChica";

export type MovimientoCajaChicaResponse = {
  id: number;
  cajaChicaId: number;
  tipo: TipoMovimientoCajaChica;
  monto: number;
  fecha: string;
  conceptoId: number;
  conceptoNombre: string;
  detalle: string | null;
  creadoPorId: number;
  creadoPorNombre: string;
  creadoEn: string;
  anulado: boolean;
  motivoAnulacion: string | null;
  anuladoPorNombre: string | null;
  fechaAnulacion: string | null;
  // Set when the movimiento was reflected into another caja (opposite tipo there).
  contraparteId: number | null;
  contraparteCajaId: number | null;
  contraparteCajaNombre: string | null;
};

// detalle is required when the concepto has requiereDetalle.
// cajaContraparteId (ADMIN/CONTABILIDAD) also registers the opposite tipo in that caja.
export type CreateMovimientoCajaChicaRequest = {
  tipo: TipoMovimientoCajaChica;
  monto: number;
  fecha: string;
  conceptoId: number;
  detalle: string | null;
  cajaContraparteId?: number | null;
};

// Spring Page as serialized by the backend.
export type MovimientoCajaChicaPage = {
  content: MovimientoCajaChicaResponse[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
};
