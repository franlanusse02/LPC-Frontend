export type TipoEventoResponse = {
  id: number;
  nombre: string;
  precio: number | null;
  comedorId: number;
  activo: boolean;
  sapId: string;
};
