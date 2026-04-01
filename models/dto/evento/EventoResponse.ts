import { EstadoEvento } from "@/models/enums/EstadoEvento";

export type EventoResponse = {
  id: number;
  comedorId: number;
  tipoEventoId: number | null;
  fechaEvento: string;
  estado: EstadoEvento;
  precioUnitario: number | null;
  montoTotal: number | null;
  tipoEventoNombre: string | null;

  // Factura PDF adjunta
  facturaPdfUrl: string | null;
  facturaPdfNombre: string | null;

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
  emailSolicitante: string | null;
  lugar: string | null;
  medioPago: string | null;
  numeroOperacion: string | null;

  // Compartido: UDESA (nro pedido), BBVA (nro orden), TECHINT (nro pedido)
  numeroOrden: string | null;

  // TECHINT
  concepto: string | null;
  tipoComprobante: string | null;
  numeroComprobante: string | null;
  creadoPorId: number | null;
  anulacionId: number | null;
};
