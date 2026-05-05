import { FacturaPuntoDeVentaMonto } from "@/models/dto/compra/FacturaPuntoDeVentaMonto";

export type FacturaPuntoDeVentaDistribucionRow = {
  puntoDeVentaId: string;
  monto: string;
};

function parseAmountToCents(value: string | number | null | undefined): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.round(value * 100) : null;
  }

  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed * 100);
}

function formatCentsToAmount(cents: number): string {
  const formatted = (cents / 100).toFixed(2);
  return formatted
    .replace(/\.00$/, "")
    .replace(/(\.\d*[1-9])0+$/, "$1");
}

function distributeCents(totalCents: number, weights: number[]): number[] {
  if (weights.length === 0) return [];
  if (totalCents <= 0) return new Array(weights.length).fill(0);

  const sanitized = weights.map((weight) =>
    Number.isFinite(weight) && weight > 0 ? Math.round(weight) : 0,
  );
  const hasWeights = sanitized.some((weight) => weight > 0);
  const effectiveWeights = hasWeights ? sanitized : new Array(weights.length).fill(1);
  const denominator = effectiveWeights.reduce((sum, weight) => sum + weight, 0);

  const base = effectiveWeights.map((weight, index) => {
    const raw = totalCents * weight;
    const assigned = Math.floor(raw / denominator);
    const remainder = raw % denominator;
    return { index, assigned, remainder };
  });

  let remaining = totalCents - base.reduce((sum, row) => sum + row.assigned, 0);
  const allocation = base.map((row) => row.assigned);

  base
    .slice()
    .sort((left, right) => {
      if (right.remainder !== left.remainder) return right.remainder - left.remainder;
      return left.index - right.index;
    })
    .forEach((row) => {
      if (remaining <= 0) return;
      allocation[row.index] += 1;
      remaining -= 1;
    });

  return allocation;
}

export function facturaDistribucionRowsFromItems(
  value: FacturaPuntoDeVentaMonto[] | null | undefined,
): FacturaPuntoDeVentaDistribucionRow[] {
  if (!value) return [];

  return [...value]
    .sort((left, right) => left.puntoDeVentaId - right.puntoDeVentaId)
    .map(({ puntoDeVentaId, monto }) => ({
      puntoDeVentaId: String(puntoDeVentaId),
      monto: String(monto),
    }));
}

export function facturaDistribucionItemsFromRows(
  rows: FacturaPuntoDeVentaDistribucionRow[],
): FacturaPuntoDeVentaMonto[] {
  return rows
    .filter((row) => row.puntoDeVentaId && row.monto.trim() !== "")
    .map((row) => ({
      puntoDeVentaId: Number(row.puntoDeVentaId),
      monto: Number(row.monto.replace(",", ".")),
    }));
}

export function rebalanceFacturaDistribucionRows(
  rows: FacturaPuntoDeVentaDistribucionRow[],
  facturaMonto: string | number,
): FacturaPuntoDeVentaDistribucionRow[] {
  if (rows.length === 0) return [];

  const totalCents = parseAmountToCents(facturaMonto);
  if (totalCents === null || totalCents <= 0) return rows;

  const distributed = distributeCents(totalCents, new Array(rows.length).fill(1));
  return rows.map((row, index) => ({
    ...row,
    monto: formatCentsToAmount(distributed[index] ?? 0),
  }));
}

export function autoAdjustFacturaDistribucionRows(
  rows: FacturaPuntoDeVentaDistribucionRow[],
  facturaMonto: string | number,
  rowIndex: number,
  nextMonto: string,
): FacturaPuntoDeVentaDistribucionRow[] {
  const normalizedMonto = nextMonto.replace(",", ".");
  const nextRows = rows.map((row, index) =>
    index === rowIndex ? { ...row, monto: normalizedMonto } : row,
  );

  if (rows.length <= 1) return nextRows;

  const totalCents = parseAmountToCents(facturaMonto);
  const editedCents = parseAmountToCents(normalizedMonto);
  if (totalCents === null || totalCents <= 0 || editedCents === null) {
    return nextRows;
  }

  const remainingCents = totalCents - editedCents;
  if (remainingCents < 0) {
    return nextRows;
  }

  const otherIndexes = rows
    .map((_, index) => index)
    .filter((index) => index !== rowIndex);
  const currentWeights = otherIndexes.map(
    (index) => parseAmountToCents(rows[index]?.monto) ?? 0,
  );
  const redistributed = distributeCents(remainingCents, currentWeights);

  return nextRows.map((row, index) => {
    if (index === rowIndex) return row;
    const redistributedIndex = otherIndexes.indexOf(index);
    return {
      ...row,
      monto: formatCentsToAmount(redistributed[redistributedIndex] ?? 0),
    };
  });
}

export function syncFacturaDistribucionRowsToMonto(
  rows: FacturaPuntoDeVentaDistribucionRow[],
  facturaMonto: string | number,
): FacturaPuntoDeVentaDistribucionRow[] {
  if (rows.length === 0) return rows;

  const totalCents = parseAmountToCents(facturaMonto);
  if (totalCents === null || totalCents <= 0) return rows;

  const currentWeights = rows.map((row) => parseAmountToCents(row.monto) ?? 0);
  const redistributed = distributeCents(totalCents, currentWeights);

  return rows.map((row, index) => ({
    ...row,
    monto: formatCentsToAmount(redistributed[index] ?? 0),
  }));
}

export function validateFacturaDistribucionRows(
  rows: FacturaPuntoDeVentaDistribucionRow[],
  facturaMonto: string | number,
): string | null {
  if (rows.length === 0) {
    return "Agregá al menos un punto de venta del comedor.";
  }

  const selectedIds = new Set<string>();
  let totalCents = 0;

  for (const row of rows) {
    if (!row.puntoDeVentaId) {
      return "Seleccioná un punto de venta en cada fila.";
    }

    if (selectedIds.has(row.puntoDeVentaId)) {
      return "No podés repetir puntos de venta del comedor.";
    }
    selectedIds.add(row.puntoDeVentaId);

    const cents = parseAmountToCents(row.monto);
    if (cents === null) {
      return "Cada monto distribuido debe ser un importe válido.";
    }
    if (cents <= 0) {
      return "Cada monto distribuido debe ser mayor a cero.";
    }

    totalCents += cents;
  }

  const facturaTotalCents = parseAmountToCents(facturaMonto);
  if (facturaTotalCents === null || facturaTotalCents <= 0) {
    return null;
  }

  if (totalCents !== facturaTotalCents) {
    return "La distribución de puntos de venta debe sumar exactamente el monto total de la factura.";
  }

  return null;
}

export function facturaDistribucionTotal(
  rows: FacturaPuntoDeVentaDistribucionRow[],
): number {
  const totalCents = rows.reduce((accumulator, row) => {
    const cents = parseAmountToCents(row.monto);
    return cents !== null ? accumulator + cents : accumulator;
  }, 0);

  return totalCents / 100;
}

export function facturaTienePuntoDeVentaComedor(
  value: FacturaPuntoDeVentaMonto[] | null | undefined,
  puntoDeVentaId: string,
): boolean {
  if (!value || !puntoDeVentaId) return false;
  return value.some((item) => String(item.puntoDeVentaId) === puntoDeVentaId);
}
