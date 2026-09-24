import type { ConsumoResponse } from "@/domain/dto/consumo/ConsumoResponse";
import type { ProductoConsumoResponse } from "@/domain/dto/consumo/ProductoConsumoResponse";

/**
 * One row of the consumos Excel: either the consumo itself (`producto: null`,
 * carries the total) or one of its products (carries cantidad/precio).
 */
export interface ConsumoExportRow {
  consumo: ConsumoResponse;
  producto: ProductoConsumoResponse | null;
}

/** Each consumo's own row, followed directly by one row per product. */
export function flattenConsumos(consumos: ConsumoResponse[]): ConsumoExportRow[] {
  return consumos.flatMap((consumo) => [
    { consumo, producto: null },
    ...consumo.productos.map((producto) => ({ consumo, producto })),
  ]);
}

/** Only the consumo row carries this value; its product rows leave it blank. */
export function soloConsumo<V>(row: ConsumoExportRow, value: (c: ConsumoResponse) => V): V | null {
  return row.producto === null ? value(row.consumo) : null;
}

export function subtotal(p: ProductoConsumoResponse): number {
  return Math.round(p.cantidad * p.precioUnitario * 100) / 100;
}
