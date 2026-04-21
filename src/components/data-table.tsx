import { ReactNode } from "react";
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SortIcon({
  active,
  dir,
}: {
  active: boolean;
  dir: "asc" | "desc";
}) {
  if (!active)
    return <ChevronsUpDown className="ml-1 inline h-3 w-3 opacity-30" />;
  return dir === "asc" ? (
    <ChevronUp className="ml-1 inline h-3 w-3 text-primary" />
  ) : (
    <ChevronDown className="ml-1 inline h-3 w-3 text-primary" />
  );
}

export function SortableTh<T extends string>({
  label,
  col,
  sortKey,
  sortDir,
  onSort,
  className,
}: {
  label: string;
  col: T;
  sortKey: T;
  sortDir: "asc" | "desc";
  onSort: (k: T) => void;
  className?: string;
}) {
  return (
    <th
      onClick={() => onSort(col)}
      className={cn(
        "px-4 py-3 cursor-pointer select-none whitespace-nowrap hover:text-gray-700 transition-colors",
        className,
      )}
    >
      {label}
      <SortIcon active={col === sortKey} dir={sortDir} />
    </th>
  );
}

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
            value === opt.value
              ? "bg-white shadow-sm text-gray-900"
              : "text-gray-500 hover:text-gray-700",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export interface DataTableProps {
  displayedCount: number;
  toolbarLeft?: ReactNode;
  toolbarRight?: ReactNode;
  columns: ReactNode;
  rows: ReactNode;
}

export function DataTable({
  displayedCount,
  toolbarLeft,
  toolbarRight,
  columns,
  rows,
}: DataTableProps) {
  return (
    <>
      {(toolbarLeft || toolbarRight) && (
        <div className="flex flex-wrap items-center gap-2 px-6 py-4 border-b">
          {toolbarLeft}
          {toolbarRight && <div className="ml-auto">{toolbarRight}</div>}
        </div>
      )}

      {displayedCount === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
          <SlidersHorizontal className="h-8 w-8 opacity-40" />
          <p className="text-sm">
            {displayedCount === 0
              ? "No hay registros"
              : "Ningún resultado para estos filtros"}
          </p>
        </div>
      ) : (
        <>
          <div className="px-6 py-2 border-b bg-gray-50/60">
            <p className="text-xs text-gray-400">
              {displayedCount} resultado{displayedCount !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100/80 text-left text-xs uppercase text-gray-500 tracking-wider">
                  {columns}
                </tr>
              </thead>
              <tbody>{rows}</tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
