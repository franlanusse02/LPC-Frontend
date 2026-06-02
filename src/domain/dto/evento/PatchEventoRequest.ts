import type { EstadoEvento } from "@/domain/enums/EstadoEvento";
import type { MedioPago } from "@/domain/enums/MedioPago";

type PatchEventoBase = {
  puntoDeVentaId?: number;
  estado?: EstadoEvento;
  medioPago?: MedioPago;
  fechaEvento?: string;
  fechaEmision?: string;
  fechaPago?: string;
  cantidadPersonas?: number;
  montoTotal?: number;
  observaciones?: string;
  servicios?: Record<number, number>;
};

export type PatchEventoDefaultRequest = PatchEventoBase & {
  tipoComedor?: "DEFAULT";
};

export type PatchEventoGaliciaRequest = PatchEventoBase & {
  tipoComedor: "GALICIA";
  solicitanteId?: number;
  emailSolicitante?: string;
  funcionarioId?: number;
  responsableId?: number;
  precioUnitario?: number;
  retenciones?: number;
  numeroOperacion?: string;
  razonSocialId?: number;
  destinatarioFacturacion?: string;
  tipoComprobante?: string;
  numeroComprobante?: string;
};

export type PatchEventoBBVARequest = PatchEventoBase & {
  tipoComedor: "BBVA";
  solicitanteId?: number;
  emailSolicitante?: string;
  ordenCompra?: string;
  legajoId?: number;
  recepcionId?: number;
};

export type PatchEventoTechintRequest = PatchEventoBase & {
  tipoComedor: "TECHINT";
  numeroPedido?: string;
  razonSocialId?: number;
  concepto?: string;
  tipoComprobante?: string;
  numeroComprobante?: string;
};

export type PatchEventoUDESARequest = PatchEventoBase & {
  tipoComedor: "UDESA";
  solicitanteId?: number;
  centroCostoId?: number;
  areaId?: number;
  precioUnitario?: number;
  adicionales?: number;
};

export type PatchEventoRequest =
  | PatchEventoDefaultRequest
  | PatchEventoGaliciaRequest
  | PatchEventoBBVARequest
  | PatchEventoTechintRequest
  | PatchEventoUDESARequest;
