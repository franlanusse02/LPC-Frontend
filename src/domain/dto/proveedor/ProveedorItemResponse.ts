export type ProveedorItemResponse = {
  id: number;
  proveedorId: number;
  codigo: string | null;
  nombre: string;
  unidadMedida: string | null;
  precioUnitario: number;
  activo: boolean;
};
