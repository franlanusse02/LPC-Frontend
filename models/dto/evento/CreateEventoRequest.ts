import { MedioPago } from "@/models/enums/MedioPago";

export type CreateEventoRequest = {
  puntoDeVentaId: number;
  tipoEventoId: number;
  fechaEvento: string;
  solicitanteId: number | null;
  emailSolicitante: string | null;
  funcionarioId: number | null;
  responsableId: number | null;
  cantidadPersonas: number | null;
  montoTotal: number | null;
  numeroOperacion: string | null;
  centroCosto: string | null;
  razonSocial: string | null;
  medioPago: MedioPago | null;
  destinatarioFacturacion: string | null;
  tipoComprobante: string | null;
  numeroComprobante: string | null;
  observaciones: string | null;
  retenciones: number | null;
};
