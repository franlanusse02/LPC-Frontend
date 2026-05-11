export type CreateEventoRequest = {
  comedorId: number;
  tipoEventoId: number;
  fechaEvento: string;
  montoTotal: number | null;
  solicitante: string | null;
  cantidadPersonas: number | null;

  funcionario: string | null;
  centroCosto: string | null;
  oficina: string | null;
  responsable: string | null;
  empresa: string | null;
  destinatarioFactura: string | null;

  // UDESA
  area: string | null;

  // Compartido: UDESA (nro pedido), BBVA (nro orden), TECHINT (nro pedido)
  numeroOrden: string | null;

  // BBVA
  emailSolicitante: string | null;
  lugar: string | null;
  medioPago: string | null;
  numeroOperacion: string | null;

  // TECHINT
  concepto: string | null;
  tipoComprobante: string | null;
  numeroComprobante: string | null;
};
