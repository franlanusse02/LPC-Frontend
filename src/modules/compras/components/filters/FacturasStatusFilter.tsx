import { FilterPills } from "@/components/data-table";
import type { EstadoFactura } from "@/domain/enums/EstadoFactura";

type StatusFilter = "all" | EstadoFactura;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "ANULADA", label: "Anuladas" },
  { value: "EMITIDA", label: "Emitidas" },
  { value: "PAGADA", label: "Pagadas" },
  { value: "PENDIENTE", label: "Pendientes" },
];

export function FacturasStatusFilter({
  value,
  onChange,
}: {
  value: StatusFilter;
  onChange: (v: StatusFilter) => void;
}) {
  return (
    <FilterPills
      options={STATUS_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
