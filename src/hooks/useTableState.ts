import {
  useDataFiltering,
  type FilterConfig,
} from "./useDataFiltering";
import {
  useSortableData,
  type SortConfig,
} from "./useSortableData";
import { useExpandableRows } from "./useExpandableRows";

export interface TableStateConfig<T> extends FilterConfig<T>, SortConfig<T> {
  defaultSortKey: keyof T;
}

interface UseTableStateReturn<T> {
  // Final displayed data (after filtering, sorting)
  displayed: T[];

  // Sort state and handler
  sort: {
    key: string;
    dir: "asc" | "desc";
    handleSort: (key: string) => void;
  };

  // Row expansion state and toggle
  expansion: {
    expandedRows: Set<number>;
    toggleRow: (id: number) => void;
  };

  // Filter state and setters
  filters: {
    search: string;
    status: string;
    setSearch: (search: string) => void;
    setStatus: (status: string) => void;
    setFilters: (
      filters: Partial<{ search: string; status: string }>
    ) => void;
  };
}

export function useTableState<T>(
  data: T[],
  config: TableStateConfig<T>,
): UseTableStateReturn<T> {
  // Layer 1: Search & status filtering
  const filtering = useDataFiltering(data, config);

  // Layer 2: Sorting
  const sorting = useSortableData(
    filtering.filtered,
    config.defaultSortKey,
    config
  );

  // Layer 3: Row expansion
  const expansion = useExpandableRows();

  return {
    displayed: sorting.sorted,
    sort: {
      key: sorting.sortKey,
      dir: sorting.sortDir,
      handleSort: sorting.handleSort,
    },
    expansion: {
      expandedRows: expansion.expandedRows,
      toggleRow: expansion.toggleRow,
    },
    filters: {
      search: filtering.filters.search,
      status: filtering.filters.status,
      setSearch: filtering.setSearch,
      setStatus: filtering.setStatus,
      setFilters: filtering.setFilters,
    },
  };
}
