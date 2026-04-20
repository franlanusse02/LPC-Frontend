import { ProductoResponse } from "./ProductoResponse";

export type ProductoConsumoResponse = {
  producto: ProductoResponse;
  precioUnitario: number;
  cantidad: number;
};
