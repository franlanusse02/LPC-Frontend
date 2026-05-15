import type { EstadoJob } from "@/domain/enums/EstadoJob";

export type TipoEventoImportJobResponse = {
  id: number;
  tipo: string;
  estado: EstadoJob;
  totalFilas: number;
  filasListas: number;
  filasConflicto: number;
  filasInvalidas: number;
  filasAplicadas: number;
  creadoEn: string;
};

