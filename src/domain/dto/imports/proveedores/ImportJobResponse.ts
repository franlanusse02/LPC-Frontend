import type { EstadoJob } from "@/domain/enums/EstadoJob";

export type ProveedorImportJobResponse = {
  id: number;
  tipo: string;
  estado: EstadoJob;
  nombreArchivo: string | null;
  totalFilas: number;
  filasListas: number;
  filasConflicto: number;
  filasInvalidas: number;
  filasAplicadas: number;
  creadoEn: string;
};
