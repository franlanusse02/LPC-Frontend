import { EstadoEvento } from "@/models/enums/EstadoEvento";
import { MedioPago } from "@/models/enums/MedioPago";

export type PatchEventoRequest = {
  puntoDeVentaId?: number | null;
  tipoEventoId?: number | null;
  estado?: EstadoEvento | null;
  medioPago?: MedioPago | null;
  fechaEvento?: string | null;
  fechaEmision?: string | null;
  fechaPago?: string | null;
  solicitanteId?: number | null;
  emailSolicitante?: string | null;
  funcionarioId?: number | null;
  responsableId?: number | null;
  cantidadPersonas?: number | null;
  precioUnitario?: number | null;
  montoTotal?: number | null;
  numeroOperacion?: string | null;
  centroCosto?: string | null;
  razonSocial?: string | null;
  destinatarioFacturacion?: string | null;
  tipoComprobante?: string | null;
  numeroComprobante?: string | null;
  observaciones?: string | null;
  retenciones?: number | null;
};
