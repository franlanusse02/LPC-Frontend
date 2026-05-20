import type { EstadoEvento } from "@/domain/enums/EstadoEvento";
import type { MedioPago } from "@/domain/enums/MedioPago";

export type PatchEventoRequest = {
  puntoDeVentaId?: number;
  tipoEventoId?: number;
  estado?: EstadoEvento;
  medioPago?: MedioPago;
  fechaEvento?: string;
  fechaEmision?: string;
  fechaPago?: string;
  solicitanteId?: number;
  emailSolicitante?: string;
  funcionarioId?: number;
  responsableId?: number;
  cantidadPersonas?: number;
  precioUnitario?: number;
  montoTotal?: number;
  numeroOperacion?: string;
  centroCosto?: string;
  razonSocial?: string;
  destinatarioFacturacion?: string;
  tipoComprobante?: string;
  numeroComprobante?: string;
  observaciones?: string;
  retenciones?: number;
};
