import { ComedorResponse } from "@/models/dto/comedor/ComedorResponse";
import { PuntoDeVentaResponse } from "@/models/dto/pto-venta/PuntoDeVentaResponse";
import { AnulacionConsumoResponse } from "@/models/dto/consumos/AnulacionConsumoResponse";
import { ConsumoResponse } from "@/models/dto/consumos/ConsumoResponse";
import { ConsumidorResponse } from "@/models/dto/consumos/ConsumidorResponse";

export type ConsumoListItem = ConsumoResponse & {
  comedorId: number | null;
  comedorNombre: string;
  puntoDeVentaNombre: string;
  consumidorNombre: string;
  consumidorTaxId: number | string | null;
  anulado: boolean;
  anulacion: AnulacionConsumoResponse | null;
};

export function buildConsumoListItem(
  consumo: ConsumoResponse,
  comedores: ComedorResponse[],
  puntosDeVenta: PuntoDeVentaResponse[],
  consumidores: ConsumidorResponse[],
  anulacion: AnulacionConsumoResponse | null = consumo.anulacion ?? null,
): ConsumoListItem {
  const puntoDeVentaId = Number(consumo.PuntoDeVentaId);
  const consumidorId = Number(consumo.consumidorId);
  const puntoDeVenta = puntosDeVenta.find((item) => Number(item.id) === puntoDeVentaId);
  const consumidor = consumidores.find((item) => Number(item.id) === consumidorId);
  const comedorId = puntoDeVenta?.comedorId ?? consumidor?.comedorId ?? null;
  const comedor = comedores.find((item) => item.id === comedorId);

  return {
    ...consumo,
    comedorId,
    comedorNombre: comedor?.nombre ?? "Sin comedor",
    puntoDeVentaNombre: puntoDeVenta?.nombre ?? `Punto ${puntoDeVentaId}`,
    consumidorNombre: consumidor?.nombre ?? `Consumidor ${consumidorId}`,
    consumidorTaxId: consumidor?.taxId ?? null,
    anulado: anulacion !== null,
    anulacion,
  };
}

export function enrichConsumos(
  consumos: ConsumoResponse[],
  comedores: ComedorResponse[],
  puntosDeVenta: PuntoDeVentaResponse[],
  consumidores: ConsumidorResponse[],
): ConsumoListItem[] {
  return consumos.map((consumo) =>
    buildConsumoListItem(consumo, comedores, puntosDeVenta, consumidores),
  );
}
