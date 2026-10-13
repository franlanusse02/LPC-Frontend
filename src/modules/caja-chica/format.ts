import type { CajaChicaResponse } from "@/domain/dto/caja-chica/CajaChicaResponse";

const ars = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

export function formatMonto(value: number) {
  return ars.format(value);
}

export function perteneceA(c: Pick<CajaChicaResponse, "comedorName" | "titularNombre">) {
  return c.comedorName ? `Comedor ${c.comedorName}` : `Cuenta de ${c.titularNombre}`;
}
