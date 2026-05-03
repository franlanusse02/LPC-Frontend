import { EstadoEvento } from "@/models/enums/EstadoEvento";
import { MedioPago } from "@/models/enums/MedioPago";

export type EventoResponse = {
  id: number;
  puntoDeVentaId: number | null;
  comedorId: number;
  tipoEventoId: number | null;
  tipoEventoNombre: string | null;
  fechaEvento: string;
  estado: EstadoEvento;
  medioPago: MedioPago | null;
  fechaEmision: string | null;
  fechaPago: string | null;
  precioUnitario: number | null;
  montoTotal: number | null;

  solicitanteId: number | null;
  solicitanteNombre: string | null;
  emailSolicitante: string | null;
  funcionarioId: number | null;
  funcionarioNombre: string | null;
  responsableId: number | null;
  responsableNombre: string | null;
  cantidadPersonas: number | null;

  centroCosto: string | null;
  razonSocial: string | null;
  destinatarioFacturacion: string | null;
  numeroOperacion: string | null;
  tipoComprobante: string | null;
  numeroComprobante: string | null;
  observaciones: string | null;
  retenciones: number | null;

  facturaPdfObjectKey: string | null;
  facturaPdfNombreArchivo: string | null;
  facturaPdfContentType: string | null;
  facturaPdfByteSize: number | null;
  facturaPdfSubidoEn: string | null;

  creadoEn: string;
  actualizadoEn: string | null;
  creadoPorId: number | null;
  anulacionId: number | null;
};
