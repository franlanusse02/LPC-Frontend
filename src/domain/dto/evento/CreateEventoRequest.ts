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
  emailSolicitante?: string | null;
  funcionarioId?: number | null;
  responsableId?: number | null;
  precioUnitario?: number | null;
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
  emailSolicitante?: string | null;
  ordenCompra?: string | null;
  legajoId?: number | null;
  recepcionId?: number | null;
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
  centroCostoId?: number | null;
  areaId?: number | null;
  precioUnitario?: number | null;
  adicionales?: number | null;
};

export type CreateEventoRequest =
  | CreateEventoDefaultRequest
  | CreateEventoGaliciaRequest
  | CreateEventoBBVARequest
  | CreateEventoTechintRequest
  | CreateEventoUDESARequest;
