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
};

// detalle is required when the concepto has requiereDetalle.
export type CreateMovimientoCajaChicaRequest = {
  tipo: TipoMovimientoCajaChica;
  monto: number;
  fecha: string;
  conceptoId: number;
  detalle: string | null;
};

// Spring Page as serialized by the backend.
export type MovimientoCajaChicaPage = {
  content: MovimientoCajaChicaResponse[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
};
