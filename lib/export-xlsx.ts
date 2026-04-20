"use client";

import { utils, writeFileXLSX } from "xlsx";

export function exportRowsToXlsx<T extends Record<string, unknown>>(
  rows: T[],
  sheetName: string,
  fileName: string,
) {
  const worksheet = utils.json_to_sheet(rows);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, sheetName);
  writeFileXLSX(workbook, ensureXlsxExtension(fileName), { compression: true });
}

export function buildExportFilename(baseName: string, parts: Array<string | null | undefined | false>) {
  const sanitizedParts = parts
    .filter(Boolean)
    .map((part) => sanitizeFilenamePart(String(part)))
    .filter(Boolean);

  const fileName = [sanitizeFilenamePart(baseName), ...sanitizedParts]
    .filter(Boolean)
    .join("_")
    .slice(0, 140);

  return ensureXlsxExtension(fileName || baseName);
}

export function sanitizeFilenamePart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function formatIsoDateForFilename(value: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return sanitizeFilenamePart(value);
  return `${day}_${month}_${year.slice(-2)}`;
}

function ensureXlsxExtension(fileName: string) {
  return fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
}
