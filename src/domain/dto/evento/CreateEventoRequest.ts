import type { MedioPago } from "@/domain/enums/MedioPago";

type CreateEventoBase = {
  puntoDeVentaId: number;
  fechaEvento: string;
  cantidadPersonas?: number | null;
  montoTotal?: number | null;
  medioPago?: MedioPago | null;
  observaciones?: string | null;
  servicios?: Record<number, number> | null;
};

export type CreateEventoDefaultRequest = CreateEventoBase & {
  tipoComedor?: "DEFAULT";
};

export type CreateEventoGaliciaRequest = CreateEventoBase & {
  tipoComedor: "GALICIA";
  solicitanteId?: number | null;
  solicitanteNombre?: string | null;
  emailSolicitante?: string | null;
  funcionarioId?: number | null;
  funcionarioNombre?: string | null;
  responsableId?: number | null;
  responsableNombre?: string | null;
  centroCostoId?: number | null;
  centroCostoNombre?: string | null;
  partidaId?: number | null;
  partidaNombre?: string | null;
  retenciones?: number | null;
  numeroOperacion?: string | null;
  razonSocialId?: number | null;
  destinatarioFacturacion?: string | null;
  tipoComprobante?: string | null;
  numeroComprobante?: string | null;
};

export type CreateEventoBBVARequest = CreateEventoBase & {
  tipoComedor: "BBVA";
  solicitanteId?: number | null;
  solicitanteNombre?: string | null;
  emailSolicitante?: string | null;
  ordenCompra?: string | null;
  legajoId?: number | null;
  legajoNombre?: string | null;
  recepcionId?: number | null;
  recepcionNombre?: string | null;
};

export type CreateEventoTechintRequest = CreateEventoBase & {
  tipoComedor: "TECHINT";
  numeroPedido?: string | null;
  razonSocialId?: number | null;
  concepto?: string | null;
  tipoComprobante?: string | null;
  numeroComprobante?: string | null;
};

export type CreateEventoUDESARequest = CreateEventoBase & {
  tipoComedor: "UDESA";
  solicitanteId?: number | null;
  solicitanteNombre?: string | null;
  centroCostoId?: number | null;
  centroCostoNombre?: string | null;
  areaId?: number | null;
  areaNombre?: string | null;
  precioUnitario?: number | null;
  adicionales?: number | null;
};

export type CreateEventoRequest =
  | CreateEventoDefaultRequest
  | CreateEventoGaliciaRequest
  | CreateEventoBBVARequest
  | CreateEventoTechintRequest
  | CreateEventoUDESARequest;
