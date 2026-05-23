import { useMemo, useRef, useState } from "react";

export interface SortConfig<T> {
  sortKeyMapping?: Record<string, (item: T) => string | number | null | undefined>;
}

interface UseSortableDataReturn<T> {
  sorted: T[];
  sortKey: string;
  sortDir: "asc" | "desc";
  handleSort: (key: string) => void;
}

export function useSortableData<T>(
  data: T[],
  defaultSortKey: keyof T,
  config: SortConfig<T>,
): UseSortableDataReturn<T> {
  const [sortKey, setSortKey] = useState<string>(String(defaultSortKey));
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sortKeyMappingRef = useRef(config.sortKeyMapping);
  sortKeyMappingRef.current = config.sortKeyMapping;

  const handleSort = (key: string) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      let av = sortKeyMappingRef.current?.[sortKey]?.(a) ?? (a as any)[sortKey];
      let bv = sortKeyMappingRef.current?.[sortKey]?.(b) ?? (b as any)[sortKey];

      if (av == null) av = "";
      if (bv == null) bv = "";

      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDir]);

  return { sorted, sortKey, sortDir, handleSort };
}
