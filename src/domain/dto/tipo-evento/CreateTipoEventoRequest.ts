export type CreateTipoEventoRequest = {
  nombre: string;
  precio: number | null;
  comedorId: number;
  sapId?: string | null;
};
