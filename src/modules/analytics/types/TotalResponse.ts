export type TotalResponse = {
  ingresos: {
    total: number;
    cierres: number;
    eventos: number;
    consumos: number;
  };
  egresos: {
    total: number;
    compras: number;
  };
  total: number;
};
