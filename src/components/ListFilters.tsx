import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";
import type { SociedadResponse } from "@/domain/dto/sociedad/SociedadResponse";
import type { ConsumidorResponse } from "@/domain/dto/consumo/ConsumidorResponse";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { FilterPills } from "@/components/data-table";
import { Input } from "@/components/ui/input";
import { useMemo } from "react";

export interface DateFieldOption {
  value: string;
  label: string;
}

export interface ListFilterState {
  comedorId: string;
  sociedadId: string;
  puntoDeVentaIds: string[];
  consumidorId: string;
  desde: string;
  hasta: string;
  dateField: string;
}

interface ListFiltersProps {
  filters: ListFilterState;
  onChange: (filters: ListFilterState) => void;
  comedores: ComedorResponse[];
  sociedades?: SociedadResponse[];
  consumidores?: ConsumidorResponse[];
  showSociedad?: boolean;
  showComedor?: boolean;
  showPuntoDeVenta?: boolean;
  dateFieldOptions?: DateFieldOption[];
}

export function ListFilters({
  filters,
  onChange,
  comedores,
  sociedades,
  consumidores,
  showSociedad = true,
  showComedor = true,
  showPuntoDeVenta = true,
  dateFieldOptions,
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

  const consumidorOptions: ComboboxOption[] = useMemo(() => {
    const list = filters.comedorId
      ? (consumidores ?? []).filter((c) => c.comedorId === Number(filters.comedorId) && c.activo)
      : (consumidores ?? []).filter((c) => c.activo);
    return list.map((c) => ({ value: String(c.id), label: c.nombre }));
  }, [consumidores, filters.comedorId]);

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
        {dateFieldOptions && dateFieldOptions.length > 1 && (
          <FilterPills
            options={dateFieldOptions}
            value={filters.dateField}
            onChange={(v) => set({ dateField: v })}
          />
        )}
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
      {showComedor && (
        <Combobox
          options={comedorOptions}
          value={filters.comedorId}
          onChange={(v) => set({ comedorId: v, puntoDeVentaIds: [], consumidorId: "" })}
          placeholder="Todos los comedores"
          clearable
          className="w-52 h-8 text-sm"
        />
      )}
      {consumidores && consumidorOptions.length > 0 && (
        <Combobox
          options={consumidorOptions}
          value={filters.consumidorId}
          onChange={(v) => set({ consumidorId: v })}
          placeholder="Todos los consumidores"
          clearable
          className="w-52 h-8 text-sm"
        />
      )}
      {showPuntoDeVenta && posOptions.length > 0 && (
        <MultiCombobox
          options={posOptions}
          values={filters.puntoDeVentaIds}
          onChange={(v) => set({ puntoDeVentaIds: v })}
          placeholder="Todos los puntos de venta"
          clearable
          className="w-48 h-8 text-sm"
        />
      )}
    </div>
  );
}
