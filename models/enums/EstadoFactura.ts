export type EstadoFactura = "ANULADO" | "EMITIDO" | "PAGADO" | "PENDIENTE";

export const EstadoFacturaLabel: Record<EstadoFactura, string> = {
  "Anulado": "ANULADO",
  "Emitido": "EMITIDO",
  "Pagado": "PAGADO",
  "Pendiente": "PENDIENTE"
};
