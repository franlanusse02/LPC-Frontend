import type { EstadoAsignacion } from "@/domain/enums/EstadoAsignacion";
import type { EstadoFila } from "@/domain/enums/EstadoFila";

export type ImportRowProductoResponse = {
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
  comedorNombre: string | null;
  comedorId: number | null;
  nombre: string | null;
  precio: number | null;
  sapId: string | null;
  activo: boolean | null;
  productoIdAplicado: number | null;
};
