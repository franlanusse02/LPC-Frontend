import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";
import type { SociedadResponse } from "@/domain/dto/sociedad/SociedadResponse";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Fragment, useMemo } from "react";
import { cn } from "@/lib/utils";

export type DateFieldFilter = "fechaFactura" | "creadoEn";

export interface ListFilterState {
  comedorId: string;
  sociedadId: string;
  puntoDeVentaId: string;
  desde: string;
  hasta: string;
  dateField: DateFieldFilter;
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

  const dateFieldOptions: { value: DateFieldFilter; label: string }[] = [
    { value: "fechaFactura", label: "Fecha Factura" },
    { value: "creadoEn", label: "Fecha de Carga" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-1 mr-1">
          {dateFieldOptions.map((opt, i) => (
            <Fragment key={opt.value}>
              {i > 0 && <span className="text-xs text-gray-300">|</span>}
              <button
                type="button"
                onClick={() => set({ dateField: opt.value })}
                className={cn(
                  "text-sm transition-colors",
                  filters.dateField === opt.value
                    ? "font-semibold text-gray-900 underline underline-offset-4"
                    : "text-gray-400 hover:text-gray-600 cursor-pointer",
                )}
              >
                {opt.label}
              </button>
            </Fragment>
          ))}
        </div>
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

function currentMonthRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
  return {
    desde: `${y}-${m}-01`,
    hasta: `${y}-${m}-${String(lastDay).padStart(2, "0")}`,
  };
}

export const defaultFilters: ListFilterState = {
  comedorId: "",
  sociedadId: "",
  puntoDeVentaId: "",
  dateField: "fechaFactura",
  ...currentMonthRange(),
};
