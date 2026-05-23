import * as XLSX from "xlsx";

export interface ExportColumn<T> {
  key: keyof T | ((item: T) => unknown);
  header: string;
}

interface ExportConfig<T> {
  data: T[];
  columns: ExportColumn<T>[];
  filename: string;
  sheetName?: string;
}

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
}: ExportConfig<T>) {
  const columns = filterNullColumns(data, allColumns);
  const header = columns.map((c) => c.header);
  const rows = data.map((item) =>
    columns.map((c) =>
      typeof c.key === "function" ? c.key(item) : item[c.key],
    ),
  );
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
