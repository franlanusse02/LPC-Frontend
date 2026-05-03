export type EmpleadoComedorResponse = {
  id: number;
  comedorId: number;
  nombre: string;
  email: string | null;
  taxId: number | null;
  activo: boolean;
};
