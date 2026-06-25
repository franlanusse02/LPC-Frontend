export type EstadoEvento = "CARGA_PARCIAL" | "SOLICITADO" | "REALIZADO" | "FACTURA_EMITIDA" | "COBRADO" | "ANULADO";

export const EstadoEventoLabel: Record<EstadoEvento, string> = {
  CARGA_PARCIAL: "Carga parcial",
  SOLICITADO: "Solicitado",
  REALIZADO: "Realizado",
  FACTURA_EMITIDA: "Factura emitida",
  COBRADO: "Cobrado",
  ANULADO: "Anulado",
};
