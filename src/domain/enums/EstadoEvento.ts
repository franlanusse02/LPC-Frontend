export type EstadoEvento = "SOLICITADO" | "REALIZADO" | "FACTURA_EMITIDA" | "COBRADO" | "ANULADO";

export const EstadoEventoLabel: Record<EstadoEvento, string> = {
  SOLICITADO: "Solicitado",
  REALIZADO: "Realizado",
  FACTURA_EMITIDA: "Factura emitida",
  COBRADO: "Cobrado",
  ANULADO: "Anulado",
};
