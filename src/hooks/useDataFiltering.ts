import { useMemo, useRef, useState } from "react";

export interface FilterConfig<T> {
  // Which fields can be searched
  searchFields?: (item: T) => string[];

  // Status/enum filter config
  statusField?: keyof T;
  statusMapping?: Record<
    string,
    { filter: (item: T) => boolean } | undefined
  >;
}

interface UseDataFilteringReturn<T> {
  // Filtered data after applying all filters
  filtered: T[];

  // Current filter state
  filters: {
    search: string;
    status: string;
  };

  // State setters
  setSearch: (search: string) => void;
  setStatus: (status: string) => void;
  setFilters: (filters: Partial<UseDataFilteringReturn<T>["filters"]>) => void;
}

export function useDataFiltering<T>(
  data: T[],
  config: FilterConfig<T>,
): UseDataFilteringReturn<T> {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const searchFieldsRef = useRef(config.searchFields);
  searchFieldsRef.current = config.searchFields;
  const statusMappingRef = useRef(config.statusMapping);
  statusMappingRef.current = config.statusMapping;

  const filtered = useMemo(() => {
    let result = [...data];

    if (search.trim() && searchFieldsRef.current) {
      const q = search.trim().toLowerCase();
      result = result.filter((item) =>
        searchFieldsRef.current!(item).some((field) =>
          String(field).toLowerCase().includes(q)
        )
      );
    }

    if (status !== "all" && config.statusField && statusMappingRef.current) {
      const filterFn = statusMappingRef.current[status];
      if (filterFn?.filter) {
        result = result.filter(filterFn.filter);
      }
    }

    return result;
  }, [data, search, status, config.statusField]);

  return {
    filtered,
    filters: { search, status },
    setSearch,
    setStatus,
    setFilters: (f) => {
      if (f.search !== undefined) setSearch(f.search);
      if (f.status !== undefined) setStatus(f.status);
    },
  };
}
