export type LegajoResponse = {
  id: number;
  taxId: number;
  nombre: string;
  comedorId: number | null;
  comedorNombre: string | null;
  // {nombre: path in lpc-files}; files are read/written through /legajos/{id}/archivos.
  archivos: Record<string, string>;
  // Active account of this legajo, if any.
  usuarioId: number | null;
};
