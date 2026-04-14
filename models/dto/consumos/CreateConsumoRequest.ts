export type CreateConsumoRequest = {
  puntoDeVentaId: number;
  fecha: string;
  consumidorId: number;
  observaciones?: string;
  productos: Record<number, number>;
};
