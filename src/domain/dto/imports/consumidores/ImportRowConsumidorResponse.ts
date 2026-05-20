import type { EstadoAsignacion } from "@/domain/enums/EstadoAsignacion";
import type { EstadoFila } from "@/domain/enums/EstadoFila";

export type ImportRowConsumidorResponse = {
  id: number;
  rowIndex: number;
  estado: EstadoFila;
  version: number;
  estadoAsignacion: EstadoAsignacion;
  asignadoAId: number | null;
  asignadoEn: string | null;
  actualizadoPorId: number | null;
  actualizadoEn: string | null;
  aplicadoPorId: number | null;
  aplicadoEn: string | null;
  errors: string | null;
  comedorNombre: string | null;
  comedorId: number | null;
  nombre: string | null;
  taxId: string | null;
  posicion: string | null;
  consumidorIdAplicado: number | null;
};
