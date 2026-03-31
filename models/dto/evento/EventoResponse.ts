import { EstadoEvento } from "@/models/enums/EstadoEvento";

export type EventoResponse = {
  id: number;
  comedorId: number;
  fechaEvento: string;
  estado: EstadoEvento;
  montoTotal: number | null;
  tipoEventoNombre: string | null;

  // Factura PDF adjunta
  facturaPdfUrl: string | null;
  facturaPdfNombre: string | null;

  // Campos comunes
  solicitante: string | null;
  cantidadPersonas: number | null;

  // Galicia
  edificio: string | null;
  sala: string | null;
  funcionario: string | null;
  centroCosto: string | null;
  oficina: string | null;
  responsable: string | null;
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
};
