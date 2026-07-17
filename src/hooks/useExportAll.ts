import { useState, useCallback } from "react";
import { useApi } from "./useApi";
import { buildQuery } from "@/lib/query-string";
import type { Page } from "@/domain/dto/shared/Page";

type FilterParams = Record<string, string | number | boolean | string[] | null | undefined>;

export function useExportAll<T>(path: string) {
  const { get } = useApi();
  const [exporting, setExporting] = useState(false);

  const fetchAll = useCallback(
    async (filters: FilterParams) => {
      setExporting(true);
      try {
        const qs = buildQuery({ ...filters, unpaged: true });
        const page: Page<T> = await get(`${path}${qs}`).then((r) => r.json());
        return page.content;
      } finally {
        setExporting(false);
      }
    },
    [get, path],
  );

  return { exporting, fetchAll };
}
