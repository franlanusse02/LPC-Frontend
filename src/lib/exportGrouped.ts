import type { ExportColumn } from "@/lib/exportXlsx";

/**
 * One row of a grouped export: the parent itself (`line: null`, carries the
 * parent's totals) or one of its lines (servicio, item, …).
 */
export interface GroupedRow<P, L> {
  parent: P;
  line: L | null;
}

export interface LineColumn<L> {
  header: string;
  value: (line: L) => unknown;
}

/** Each parent's own row, followed directly by one row per line. */
export function flattenWithLines<P, L>(
  parents: P[],
  linesOf: (parent: P) => L[],
): GroupedRow<P, L>[] {
  return parents.flatMap((parent) => [
    { parent, line: null },
    ...linesOf(parent).map((line) => ({ parent, line })),
  ]);
}

export const isParentRow = <P, L>(row: GroupedRow<P, L>) => row.line === null;

/**
 * Turns a parent export's columns into grouped-row columns. The column headed
 * `replace` (the old joined "a x1, b x2" cell) becomes `lineColumns`, filled on
 * line rows only. Columns listed in `repeat` show on every row so each line can
 * be filtered on its own; every other column shows on the parent row only, so
 * summing a total never double-counts.
 */
export function groupedColumns<P, L>(
  columns: ExportColumn<P>[],
  opts: { replace: string; repeat: string[]; lineColumns: LineColumn<L>[] },
): ExportColumn<GroupedRow<P, L>>[] {
  const valueOf = (col: ExportColumn<P>, parent: P) =>
    typeof col.key === "function" ? col.key(parent) : parent[col.key];

  const lineCols: ExportColumn<GroupedRow<P, L>>[] = opts.lineColumns.map((lc) => ({
    header: lc.header,
    key: (row) => (row.line === null ? null : lc.value(row.line)),
  }));

  const out: ExportColumn<GroupedRow<P, L>>[] = [];
  let replaced = false;
  for (const col of columns) {
    if (col.header === opts.replace) {
      out.push(...lineCols);
      replaced = true;
      continue;
    }
    const repeat = opts.repeat.includes(col.header);
    out.push({
      header: col.header,
      key: (row) => (repeat || row.line === null ? valueOf(col, row.parent) : null),
    });
  }
  if (!replaced) out.push(...lineCols);
  return out;
}
