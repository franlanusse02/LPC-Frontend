export type FacturaPuntoDeVentaComedor = Record<string, number>;

export type FacturaPuntoDeVentaDistribucionRow = {
  puntoDeVentaId: string;
  porcentaje: string;
};

export function facturaDistribucionEvenSplit(count: number): string[] {
  if (count <= 0) return [];

  const base = Math.floor(100 / count);
  const remainder = 100 % count;

  return Array.from({ length: count }, (_, index) =>
    String(base + (index < remainder ? 1 : 0)),
  );
}

export function rebalanceFacturaDistribucionRows(
  rows: FacturaPuntoDeVentaDistribucionRow[],
): FacturaPuntoDeVentaDistribucionRow[] {
  const porcentajes = facturaDistribucionEvenSplit(rows.length);

  return rows.map((row, index) => ({
    ...row,
    porcentaje: porcentajes[index] ?? row.porcentaje,
  }));
}

export function facturaDistribucionRowsFromRecord(
  value: FacturaPuntoDeVentaComedor | null | undefined,
): FacturaPuntoDeVentaDistribucionRow[] {
  if (!value) return [];

  return Object.entries(value)
    .sort(([leftId], [rightId]) => Number(leftId) - Number(rightId))
    .map(([puntoDeVentaId, porcentaje]) => ({
      puntoDeVentaId,
      porcentaje: String(porcentaje),
    }));
}

export function facturaDistribucionRecordFromRows(
  rows: FacturaPuntoDeVentaDistribucionRow[],
): FacturaPuntoDeVentaComedor {
  return Object.fromEntries(
    rows
      .filter((row) => row.puntoDeVentaId && row.porcentaje.trim() !== "")
      .map((row) => [row.puntoDeVentaId, Number(row.porcentaje)]),
  );
}

export function validateFacturaDistribucionRows(
  rows: FacturaPuntoDeVentaDistribucionRow[],
): string | null {
  if (rows.length === 0) {
    return "Agregá al menos un punto de venta del comedor.";
  }

  const selectedIds = new Set<string>();
  let total = 0;

  for (const row of rows) {
    if (!row.puntoDeVentaId) {
      return "Seleccioná un punto de venta en cada fila.";
    }

    if (selectedIds.has(row.puntoDeVentaId)) {
      return "No podés repetir puntos de venta del comedor.";
    }
    selectedIds.add(row.puntoDeVentaId);

    if (!/^\d+$/.test(row.porcentaje.trim())) {
      return "Cada porcentaje debe ser un número entero positivo.";
    }

    const porcentaje = Number(row.porcentaje);
    if (porcentaje <= 0) {
      return "Cada porcentaje debe ser mayor a cero.";
    }

    total += porcentaje;
  }

  if (total !== 100) {
    return "La distribución de puntos de venta debe sumar 100%.";
  }

  return null;
}

export function facturaDistribucionTotal(
  rows: FacturaPuntoDeVentaDistribucionRow[],
): number {
  return rows.reduce((accumulator, row) => {
    const value = Number(row.porcentaje);
    return Number.isFinite(value) ? accumulator + value : accumulator;
  }, 0);
}

export function facturaTienePuntoDeVentaComedor(
  value: FacturaPuntoDeVentaComedor | null | undefined,
  puntoDeVentaId: string,
): boolean {
  if (!value || !puntoDeVentaId) return false;
  return Object.prototype.hasOwnProperty.call(value, puntoDeVentaId);
}
