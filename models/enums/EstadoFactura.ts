export type EstadoFactura = "ANULADA" | "EMITIDA" | "PAGADA" | "PENDIENTE";

export const EstadoFacturaLabel: Record<EstadoFactura, string> = {
  ANULADA: "Anulada",
  EMITIDA: "Emitida",
  PAGADA: "Pagada",
  PENDIENTE: "Pendiente",
};
