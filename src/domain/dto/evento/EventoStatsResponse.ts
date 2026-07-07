export type EventoStatsResponse = {
  total: number;
  activos: number;
  anulados: number;
  montoTotalActivo: number;
  montoFiltradoActivo: number;
  countsByTipo: Record<string, number>;
};
