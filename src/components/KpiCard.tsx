import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { cn, fmtCurrency } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

interface KpiCardProps {
  title: string;
  endpoint: string;
  filters?: Record<string, string | undefined>;
  format?: "currency" | "percentage" | "number";
  valueExtractor?: (data: unknown) => number;
  accent?: "emerald" | "red" | "blue";
  className?: string;
}

export function KpiCard({
  title,
  endpoint,
  filters,
  format = "number",
  valueExtractor = (d) => (typeof d === "number" ? d : 0),
  accent,
  className,
}: KpiCardProps) {
  const { get } = useApi();
  const [value, setValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const filterKey = JSON.stringify(filters);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    const params = new URLSearchParams();
    if (filters) {
      for (const [k, v] of Object.entries(filters)) {
        if (v) params.set(k, v);
      }
    }
    const qs = params.toString();
    const url = qs ? `${endpoint}?${qs}` : endpoint;

    get(url, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => setValue(valueExtractor(data)))
      .catch((err) => {
        if (err.name !== "AbortError") setValue(null);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [get, endpoint, filterKey]);

  const formatted =
    value === null
      ? "—"
      : format === "currency"
        ? fmtCurrency(value)
        : format === "percentage"
          ? `${value}%`
          : value.toLocaleString("es-AR");

  return (
    <div
      className={cn(
        "rounded-xl border-0 bg-white shadow-sm px-5 py-4 min-w-0 @container",
        className,
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {title}
      </p>
      {loading ? (
        <div className="mt-2">
          <Spinner className="size-5" />
        </div>
      ) : (
        <p
          className={cn(
            "mt-1 text-[clamp(1.25rem,5cqi,1.75rem)] font-bold tabular-nums",
            accent === "emerald" && "text-emerald-600",
            accent === "red" && "text-red-500",
            accent === "blue" && "text-blue-600",
            !accent && "text-gray-800",
          )}
        >
          {formatted}
        </p>
      )}
    </div>
  );
}
