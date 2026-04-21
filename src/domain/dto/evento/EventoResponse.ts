import type { EstadoEvento } from "@/domain/enums/EstadoEvento";
import type { MedioPago } from "@/domain/enums/MedioPago";

export type EventoResponse = {
  id: number;
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

  // Campos comunes
  solicitante: string | null;
  emailSolicitante: string | null;
  funcionario: string | null;
  responsable: string | null;
  cantidadPersonas: number | null;

  edificioId: number | null;
  edificioNombre: string | null;
  salaId: number | null;
  salaNombre: string | null;
  centroCosto: string | null;
  oficina: string | null;
  empresa: string | null;
  destinatarioFactura: string | null;

  // UDESA
  area: string | null;

  // BBVA
  lugar: string | null;
  numeroOperacion: string | null;

  // Compartido: UDESA (nro pedido), BBVA (nro orden), TECHINT (nro pedido)
  numeroOrden: string | null;

  // TECHINT
  concepto: string | null;
  tipoComprobante: string | null;
  numeroComprobante: string | null;
  observaciones: string | null;
  retenciones: number | null;

  // Factura PDF adjunta
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
