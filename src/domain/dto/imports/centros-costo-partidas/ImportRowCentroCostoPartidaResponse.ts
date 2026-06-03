import type { EstadoAsignacion } from "@/domain/enums/EstadoAsignacion";
import type { EstadoFila } from "@/domain/enums/EstadoFila";

export type ImportRowCentroCostoPartidaResponse = {
  id: number;
  rowIndex: number;
  estado: EstadoFila;
  version: number;
  estadoAsignacion: EstadoAsignacion;
  asignadoAId: number | null;
  asignadoANombre: string | null;
  asignadoEn: string | null;
  actualizadoPorId: number | null;
  actualizadoEn: string | null;
  aplicadoPorId: number | null;
  aplicadoEn: string | null;
  errors: string | null;
  ccComedorNombre: string | null;
  ccComedorId: number | null;
  ccNombre: string | null;
  ccIdAplicado: number | null;
  partidaComedorNombre: string | null;
  partidaComedorId: number | null;
  partidaNombre: string | null;
  partidaIdAplicado: number | null;
};
