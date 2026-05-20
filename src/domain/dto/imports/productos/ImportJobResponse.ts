import type { EstadoJob } from "@/domain/enums/EstadoJob";

export type ProductoImportJobResponse = {
  id: number;
  tipo: string;
  estado: EstadoJob;
  nombreArchivo: string;
  totalFilas: number;
  filasListas: number;
  filasConflicto: number;
  filasInvalidas: number;
  filasAplicadas: number;
  creadoEn: string;
};
