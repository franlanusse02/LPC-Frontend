export type CreateConsumoRequest = {
  puntoDeVentaId: number;
  consumidorId: number;
  fecha: string;
  observaciones?: string;
  productos: Record<number, number>;
};
