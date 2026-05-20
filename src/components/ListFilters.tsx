import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";
import type { SociedadResponse } from "@/domain/dto/sociedad/SociedadResponse";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { useMemo } from "react";

export interface ListFilterState {
  comedorId: string;
  sociedadId: string;
  puntoDeVentaId: string;
  desde: string;
  hasta: string;
}

interface ListFiltersProps {
  filters: ListFilterState;
  onChange: (filters: ListFilterState) => void;
  comedores: ComedorResponse[];
  sociedades?: SociedadResponse[];
  showSociedad?: boolean;
  showPuntoDeVenta?: boolean;
}

export function ListFilters({
  filters,
  onChange,
  comedores,
  sociedades,
  showSociedad = true,
  showPuntoDeVenta = true,
}: ListFiltersProps) {
  const set = (partial: Partial<ListFilterState>) =>
    onChange({ ...filters, ...partial });

  const comedorOptions: ComboboxOption[] = useMemo(
    () => comedores.map((c) => ({ value: String(c.id), label: c.nombre })),
    [comedores],
  );

  const sociedadOptions: ComboboxOption[] = useMemo(
    () =>
      (sociedades ?? []).map((s) => ({
        value: String(s.id),
        label: s.nombre,
      })),
    [sociedades],
  );

  const posOptions: ComboboxOption[] = useMemo(() => {
    const selected = comedores.find(
      (c) => c.id === Number(filters.comedorId),
    );
    if (!selected?.puntosDeVenta) return [];
    return selected.puntosDeVenta.map((p) => ({
      value: String(p.id),
      label: p.nombre,
    }));
  }, [comedores, filters.comedorId]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        <Input
          type="date"
          value={filters.desde}
          onChange={(e) => set({ desde: e.target.value })}
          className="h-8 w-36 text-sm bg-gray-50 border-gray-200"
        />
        <span className="text-xs text-gray-400">—</span>
        <Input
          type="date"
          value={filters.hasta}
          onChange={(e) => set({ hasta: e.target.value })}
          className="h-8 w-36 text-sm bg-gray-50 border-gray-200"
        />
      </div>
      {showSociedad && sociedades && sociedades.length > 0 && (
        <Combobox
          options={sociedadOptions}
          value={filters.sociedadId}
          onChange={(v) => set({ sociedadId: v })}
          placeholder="Todas las sociedades"
          clearable
          className="w-48 h-8 text-sm"
        />
      )}
      <Combobox
        options={comedorOptions}
        value={filters.comedorId}
        onChange={(v) => set({ comedorId: v, puntoDeVentaId: "" })}
        placeholder="Todos los comedores"
        clearable
        className="w-52 h-8 text-sm"
      />
      {showPuntoDeVenta && posOptions.length > 0 && (
        <Combobox
          options={posOptions}
          value={filters.puntoDeVentaId}
          onChange={(v) => set({ puntoDeVentaId: v })}
          placeholder="Todos los puntos de venta"
          clearable
          className="w-48 h-8 text-sm"
        />
      )}
    </div>
  );
}

export const defaultFilters: ListFilterState = {
  comedorId: "",
  sociedadId: "",
  puntoDeVentaId: "",
  desde: "",
  hasta: "",
};
