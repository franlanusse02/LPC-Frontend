import { useCallback, useState } from "react";

export interface UseRowSelectionReturn {
  selected: Set<number>;
  toggle: (id: number) => void;
  toggleAll: (allIds: number[]) => void;
  clear: () => void;
  isAllSelected: (allIds: number[]) => boolean;
  isSomeSelected: () => boolean;
  count: number;
}

export function useRowSelection(): UseRowSelectionReturn {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((allIds: number[]) => {
    setSelected((prev) => {
      const allSelected = allIds.length > 0 && allIds.every((id) => prev.has(id));
      if (allSelected) return new Set();
      return new Set(allIds);
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const isAllSelected = useCallback(
    (allIds: number[]) => allIds.length > 0 && allIds.every((id) => selected.has(id)),
    [selected],
  );

  const isSomeSelected = useCallback(() => selected.size > 0, [selected]);

  return {
    selected,
    toggle,
    toggleAll,
    clear,
    isAllSelected,
    isSomeSelected,
    count: selected.size,
  };
}
