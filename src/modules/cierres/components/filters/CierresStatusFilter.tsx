import { FilterPills } from "@/components/data-table";

type StatusFilter = "all" | "active" | "anulado";

const STATUS_OPTIONS = [
  { value: "all" as const, label: "Todos" },
  { value: "active" as const, label: "Activos" },
  { value: "anulado" as const, label: "Anulados" },
];

export function CierresStatusFilter({
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
