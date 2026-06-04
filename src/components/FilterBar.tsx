import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { FunnelX, Search, X } from "lucide-react";
import { Button } from "./ui/button";

export interface FilterBarProps<
  T extends { comedor?: { nombre: string; sociedad: string } },
> {
  data: T[];
  onFiltered: (filtered: T[]) => void;
  searchFields?: (item: T) => string[];
}

export function FilterBar<
  T extends { comedor?: { nombre: string; sociedad: string } },
>({ data, onFiltered, searchFields }: FilterBarProps<T>) {
  const [search, setSearch] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [comedorFilter, setComedorFilter] = useState("");
  const [sociedadFilter, setSociedadFilter] = useState("");

  const comedores = useMemo(
    () =>
      [
        ...new Set(
          data
            .map((item) => item.comedor?.nombre)
            .filter((n): n is string => n !== undefined),
        ),
      ].sort(),
    [data],
  );

  const sociedades = useMemo(
    () =>
      [
        ...new Set(
          data
            .map((item) => item.comedor?.sociedad)
            .filter((s): s is string => s !== undefined),
        ),
      ].sort(),
    [data],
  );

  const filtered = useMemo(() => {
    let result = [...data];

    if (fechaDesde) {
      result = result.filter((item: any) => item.fechaOperacion >= fechaDesde);
    }
    if (fechaHasta) {
      result = result.filter((item: any) => item.fechaOperacion <= fechaHasta);
    }
    if (comedorFilter) {
      result = result.filter(
        (item: any) => item.comedor?.nombre === comedorFilter,
      );
    }
    if (sociedadFilter) {
      result = result.filter(
        (item: any) => item.comedor?.sociedad === sociedadFilter,
      );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((item) => {
        const fields = searchFields ? searchFields(item) : [];
        return fields.some((f) => f.toLowerCase().includes(q));
      });
    }

    return result;
  }, [
    data,
    fechaDesde,
    fechaHasta,
    comedorFilter,
    sociedadFilter,
    search,
    searchFields,
  ]);

  const hasActiveFilters =
    search || fechaDesde || fechaHasta || comedorFilter || sociedadFilter;

  const handleClearFilters = () => {
    setSearch("");
    setFechaDesde("");
    setFechaHasta("");
    setComedorFilter("");
    setSociedadFilter("");
  };

  useEffect(() => {
    onFiltered(filtered);
  }, [filtered, onFiltered]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Clear filters button */}
      {hasActiveFilters && (
        <Button
          onClick={handleClearFilters}
          variant="outline"
          className="text-xs text-primary hover:underline underline-offset-2"
        >
          <FunnelX className="h-3.5 w-3.5" />
        </Button>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar..."
          className="pl-8 h-8 w-52 text-sm bg-gray-50 border-gray-200"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Date range */}
      <div className="flex items-center gap-1">
        <Input
          type="date"
          value={fechaDesde}
          onChange={(e) => setFechaDesde(e.target.value)}
          className="h-8 w-36 text-sm bg-gray-50 border-gray-200"
        />
        <span className="text-xs text-gray-400">—</span>
        <Input
          type="date"
          value={fechaHasta}
          onChange={(e) => setFechaHasta(e.target.value)}
          className="h-8 w-36 text-sm bg-gray-50 border-gray-200"
        />
      </div>

      {/* Sociedad */}
      {sociedades.length > 0 && (
        <Combobox
          options={sociedades.map((s) => ({ value: s, label: s }))}
          value={sociedadFilter}
          onChange={setSociedadFilter}
          placeholder="Todas las sociedades"
          clearable
          className="h-8 text-sm"
        />
      )}

      {/* Comedor */}
      {comedores.length > 0 && (
        <Combobox
          options={comedores.map((c) => ({ value: c, label: c }))}
          value={comedorFilter}
          onChange={setComedorFilter}
          placeholder="Todos los comedores"
          clearable
          className="h-8 text-sm"
        />
      )}
    </div>
  );
}
