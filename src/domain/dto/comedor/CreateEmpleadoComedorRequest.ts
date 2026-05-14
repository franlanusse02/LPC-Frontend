export type CreateEmpleadoComedorRequest = {
  comedorId: number;
  nombre: string;
  email?: string | null;
  taxId?: number | null;
  centroCosto?: string | null;
  partida?: string | null;
};
