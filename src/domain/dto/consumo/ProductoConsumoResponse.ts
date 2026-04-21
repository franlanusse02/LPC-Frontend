export type ProductoConsumoResponse = {
  producto: {
    productoId: number;
    comedorId: number;
    nombre: string;
    precio: number;
    activo: boolean;
  };
  precioUnitario: number;
  cantidad: number;
};
