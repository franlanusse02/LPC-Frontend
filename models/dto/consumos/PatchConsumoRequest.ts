export type PatchConsumoRequest = {
  puntoDeVentaId?: number;
  fecha?: string;
  consumidorId?: number;
  observaciones?: string;
  productos?: Record<number, number>;
};
