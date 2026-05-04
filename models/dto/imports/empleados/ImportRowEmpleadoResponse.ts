import { EstadoAsignacion } from "@/models/enums/EstadoAsignacion";
import { EstadoFila } from "@/models/enums/EstadoFila";

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
  comedorNombre: string | null;
  comedorId: number | null;
  nombre: string | null;
  email: string | null;
  taxId: string | null;
  empleadoIdAplicado: number | null;
};
