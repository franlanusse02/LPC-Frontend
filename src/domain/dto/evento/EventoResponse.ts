import type { EstadoEvento } from "@/domain/enums/EstadoEvento";
import type { MedioPago } from "@/domain/enums/MedioPago";
import type { ProductoConsumoResponse } from "@/domain/dto/consumo/ProductoConsumoResponse";

type EventoBase = {
  id: number;
  puntoDeVentaId: number;
  comedorId: number;
  estado: EstadoEvento;
  medioPago: MedioPago | null;
  fechaEvento: string;
  fechaEmision: string | null;
  fechaPago: string | null;
  cantidadPersonas: number | null;
  montoTotal: number | null;
  observaciones: string | null;
  servicios: ProductoConsumoResponse[];
  facturaPdfObjectKey: string | null;
  facturaPdfNombreArchivo: string | null;
  facturaPdfContentType: string | null;
  facturaPdfByteSize: number | null;
  facturaPdfSubidoEn: string | null;
  creadoEn: string;
  actualizadoEn: string;
  creadoPorId: number | null;
  anulacionId: number | null;
};

export type EventoDefaultResponse = EventoBase & {
  tipoComedor: "DEFAULT";
};

export type EventoGaliciaResponse = EventoBase & {
  tipoComedor: "GALICIA";
  solicitanteId: number | null;
  solicitanteNombre: string | null;
  emailSolicitante: string | null;
  funcionarioId: number | null;
  funcionarioNombre: string | null;
  responsableId: number | null;
  responsableNombre: string | null;
  centroCosto: string | null;
  partida: string | null;
  precioUnitario: number | null;
  retenciones: number | null;
  numeroOperacion: string | null;
  razonSocialId: number | null;
  razonSocial: string | null;
  destinatarioFacturacion: string | null;
  tipoComprobante: string | null;
  numeroComprobante: string | null;
};

export type EventoBBVAResponse = EventoBase & {
  tipoComedor: "BBVA";
  solicitanteId: number | null;
  solicitanteNombre: string | null;
  emailSolicitante: string | null;
  ordenCompra: string | null;
  legajoId: number | null;
  legajo: string | null;
  recepcionId: number | null;
  recepcion: string | null;
};

export type EventoTechintResponse = EventoBase & {
  tipoComedor: "TECHINT";
  numeroPedido: string | null;
  razonSocialId: number | null;
  razonSocial: string | null;
  concepto: string | null;
  tipoComprobante: string | null;
  numeroComprobante: string | null;
};

export type EventoUDESAResponse = EventoBase & {
  tipoComedor: "UDESA";
  solicitanteId: number | null;
  solicitanteNombre: string | null;
  centroCostoId: number | null;
  centroCosto: string | null;
  areaId: number | null;
  area: string | null;
  precioUnitario: number | null;
  adicionales: number | null;
};

export type EventoResponse =
  | EventoDefaultResponse
  | EventoGaliciaResponse
  | EventoBBVAResponse
  | EventoTechintResponse
  | EventoUDESAResponse;
