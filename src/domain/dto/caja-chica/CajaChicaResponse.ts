// A caja belongs to exactly one comedor OR one account (titular).
export type CajaChicaResponse = {
  id: number;
  nombre: string;
  comedorId: number | null;
  comedorName: string | null;
  titularUsuarioId: number | null;
  titularNombre: string | null;
  activa: boolean;
  // ingresos − egresos over non-anulados movimientos; may be negative.
  saldo: number;
  creadoEn: string;
  accesos: { usuarioId: number; nombre: string }[];
};

// What CARGA_DATOS gets to pick a caja: never saldo or history.
export type CajaChicaParaCargaResponse = {
  id: number;
  nombre: string;
  comedorId: number | null;
  comedorName: string | null;
};
