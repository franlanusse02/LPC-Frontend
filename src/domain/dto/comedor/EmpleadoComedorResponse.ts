export type EmpleadoComedorResponse = {
  id: number;
  comedorId: number;
  nombre: string;
  email: string;
  taxId: number;
  activo: boolean;
  centroCostoId: number | null;
  centroCostoNombre: string | null;
  partidaId: number | null;
  partidaNombre: string | null;
};
