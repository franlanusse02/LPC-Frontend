import type { EstadoJob } from "@/domain/enums/EstadoJob";
import type { EstadoFila } from "@/domain/enums/EstadoFila";

export type ImportJob = {
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

export type ImportRow = {
  id: number;
  rowIndex: number;
  estado: EstadoFila;
  version: number;
  errors: string | null;
  [key: string]: unknown;
};
