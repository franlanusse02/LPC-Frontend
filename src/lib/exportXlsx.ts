import * as XLSX from "xlsx-js-style";

export interface ExportColumn<T> {
  key: keyof T | ((item: T) => unknown);
  header: string;
}

interface ExportConfig<T> {
  data: T[];
  columns: ExportColumn<T>[];
  filename: string;
  sheetName?: string;
  /** Rows for which this returns `true` get a red fill in the sheet. */
  highlightRow?: (item: T) => boolean;
  /** Rows for which this returns `true` are written in bold. */
  boldRow?: (item: T) => boolean;
}

const BOLD_ROW_STYLE = { font: { bold: true } } as const;

const RED_ROW_STYLE = {
  fill: { patternType: "solid", fgColor: { rgb: "FFFF0000" } },
  font: { color: { rgb: "FFFFFFFF" } },
} as const;

function filterNullColumns<T>(
  data: T[],
  allColumns: ExportColumn<T>[],
): ExportColumn<T>[] {
  return allColumns.filter((col) =>
    data.some((row) => {
      const val =
        typeof col.key === "function" ? col.key(row) : row[col.key];
      return val != null && val !== "";
    }),
  );
}

export function exportToXlsx<T>({
  data,
  columns: allColumns,
  filename,
  sheetName = "Datos",
  highlightRow,
  boldRow,
}: ExportConfig<T>) {
  const columns = filterNullColumns(data, allColumns);
  const header = columns.map((c) => c.header);
  const rows = data.map((item) =>
    columns.map((c) =>
      typeof c.key === "function" ? c.key(item) : item[c.key],
    ),
  );
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);

  const styleRow = (i: number, style: { font?: object; fill?: object }) => {
    const r = i + 1; // row 0 is the header
    for (let c = 0; c < columns.length; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = (ws[addr] ??= { t: "s", v: "" });
      const prev = cell.s ?? {};
      cell.s = { ...prev, ...style, font: { ...(prev.font ?? {}), ...(style.font ?? {}) } };
    }
  };

  data.forEach((item, i) => {
    if (boldRow?.(item)) styleRow(i, BOLD_ROW_STYLE);
    if (highlightRow?.(item)) styleRow(i, RED_ROW_STYLE);
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
