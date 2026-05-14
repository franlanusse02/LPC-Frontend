import type { MedioPago } from "@/domain/enums/MedioPago";

export type CreateEventoRequest = {
  puntoDeVentaId: number;
  tipoEventoId: number;
  fechaEvento: string;
  solicitanteId?: number | null;
  emailSolicitante?: string | null;
  funcionarioId?: number | null;
  responsableId?: number | null;
  cantidadPersonas?: number | null;
  montoTotal: number;
  numeroOperacion?: string | null;
  centroCosto?: string | null;
  partida?: string | null;
  razonSocial?: string | null;
  MedioPago?: MedioPago | null;
  destinatarioFacturacion?: string | null;
  tipoComprobante?: string | null;
  numeroComprobante?: string | null;
  observaciones?: string | null;
};
