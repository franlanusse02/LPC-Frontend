import type { EstadoAsignacion } from "@/domain/enums/EstadoAsignacion";
import type { EstadoFila } from "@/domain/enums/EstadoFila";

export type ImportRowEmpleadoResponse = {
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
  nombre: string | null;
  email: string | null;
  taxId: string | null;
  centroCosto: string | null;
  partida: string | null;
  comedorIdAplicado: number | null;
};
