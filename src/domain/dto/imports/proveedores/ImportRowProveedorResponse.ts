import type { EstadoAsignacion } from "@/domain/enums/EstadoAsignacion";
import type { EstadoFila } from "@/domain/enums/EstadoFila";

export type ImportRowProveedorResponse = {
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
  taxId: string | null;
  formaDePagoPredeterminada: string | null;
  puntosDeVenta: string | null;
  proveedorIdAplicado: number | null;
};
