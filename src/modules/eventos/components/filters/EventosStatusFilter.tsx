import { FilterPills } from "@/components/data-table";
import type { EstadoEvento } from "@/domain/enums/EstadoEvento";

type StatusFilter = "all" | EstadoEvento;

const STATUS_OPTIONS = [
  { value: "all" as const, label: "Todos" },
  { value: "SOLICITADO" as const, label: "Solicitado" },
  { value: "REALIZADO" as const, label: "Realizado" },
  { value: "FACTURA_EMITIDA" as const, label: "Factura emitida" },
  { value: "COBRADO" as const, label: "Cobrado" },
  { value: "ANULADO" as const, label: "Anulado" },
];

export function EventosStatusFilter({
  value,
  onChange,
}: {
  value: StatusFilter;
  onChange: (v: StatusFilter) => void;
}) {
  return <FilterPills options={STATUS_OPTIONS} value={value} onChange={onChange} />;
}
