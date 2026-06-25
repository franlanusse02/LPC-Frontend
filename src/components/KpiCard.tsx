import { useEffect, useRef, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { cn, fmtCurrency } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

interface KpiCardProps {
  title: string;
  endpoint: string;
  filters?: Record<string, string | string[] | undefined>;
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

  const filterKey = JSON.stringify(filters);
  const requestKey = `${endpoint}|${filterKey}`;

  const [result, setResult] = useState<{ fetchedFor: string | null; value: number | null }>({
    fetchedFor: null,
    value: null,
  });
  const loading = result.fetchedFor !== requestKey;

  const valueExtractorRef = useRef(valueExtractor);
  valueExtractorRef.current = valueExtractor;

  useEffect(() => {
    const controller = new AbortController();
    const key = `${endpoint}|${filterKey}`;

    const parsed: Record<string, string | string[] | undefined> = filterKey ? JSON.parse(filterKey) : {};
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(parsed)) {
      if (Array.isArray(v)) {
        for (const item of v) if (item) params.append(k, item);
      } else if (v) {
        params.set(k, v);
      }
    }
    const qs = params.toString();
    const url = qs ? `${endpoint}?${qs}` : endpoint;

    get(url, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => setResult({ fetchedFor: key, value: valueExtractorRef.current(data) }))
      .catch((err) => {
        if (err.name !== "AbortError") setResult({ fetchedFor: key, value: null });
      });

    return () => controller.abort();
  }, [get, endpoint, filterKey]);

  const value = result.value;
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
