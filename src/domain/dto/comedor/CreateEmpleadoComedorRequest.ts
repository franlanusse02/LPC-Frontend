export type CreateEmpleadoComedorRequest = {
  comedorId: number;
  nombre: string;
  email?: string | null;
  taxId?: number | null;
  centroCostoId?: number | null;
  partidaId?: number | null;
};
