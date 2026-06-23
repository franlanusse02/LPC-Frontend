import { FilterPills } from "@/components/data-table";
import type { EstadoOrden } from "@/domain/enums/EstadoOrden";

type StatusFilter = "all" | EstadoOrden;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "PENDIENTE", label: "Pendientes" },
  { value: "APROBADA", label: "Aprobadas" },
  { value: "ENVIADA", label: "Enviadas" },
  { value: "CANCELADA", label: "Canceladas" },
];

export function OrdenesStatusFilter({
  value,
  onChange,
}: {
  value: StatusFilter;
  onChange: (v: StatusFilter) => void;
}) {
  return <FilterPills options={STATUS_OPTIONS} value={value} onChange={onChange} />;
}
