export type ProveedorItemResponse = {
  id: number;
  proveedorId: number;
  proveedorNombre?: string | null;
  codigo: string | null;
  nombre: string;
  unidadMedida: string | null;
  precioUnitario: number;
  activo: boolean;
};
