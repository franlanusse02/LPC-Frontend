export type PatchImportRowProductoRequest = {
  version: number;
  productoId: number | null;
  comedorId: number | null;
  nombre: string | null;
  precio: number | null;
  sapId: string | null;
  activo: boolean | null;
};
