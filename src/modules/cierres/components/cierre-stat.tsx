import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "emerald" | "red" | "blue";
}) {
  return (
    <div className="rounded-xl border-0 bg-white shadow-sm px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-2xl font-bold tabular-nums",
          accent === "emerald" && "text-emerald-600",
          accent === "red" && "text-red-500",
          accent === "blue" && "text-blue-600",
          !accent && "text-gray-800",
        )}
      >
        {value}
      </p>
    </div>
  );
}
