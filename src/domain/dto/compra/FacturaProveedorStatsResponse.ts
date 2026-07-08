export type FacturaProveedorStatsResponse = {
  total: number;
  pendientes: number;
  emitidas: number;
  pagadas: number;
  anuladas: number;
  montoTotalActivo: number;
  montoFiltradoActivo: number;
};
