import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import type { TotalResponse } from "../types/TotalResponse";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(n);

export default function TotalesContabilidad() {
  const [ingresosExpanded, setIngresosExpanded] = useState(false);
  const [egresosExpanded, setEgresosExpanded] = useState(false);
  const [totales, setTotales] = useState<TotalResponse>();
  const { get } = useApi();

  useEffect(() => {
    get("/analytics/contabilidad/totales").then((response) =>
      response.json().then(setTotales),
    );
  }, [get]);

  return (
    <div className="mt-8 w-full flex items-center justify-center">
      <div className="w-1/2 grid grid-cols-1 items-start gap-4 xl:grid-cols-1">
        <button
          type="button"
          onClick={() => setIngresosExpanded((current) => !current)}
          className={cn(
            "flex min-w-0 flex-col justify-start rounded-xl bg-white px-5 py-3 text-left shadow-sm transition hover:shadow-md",
            ingresosExpanded ? "h-auto self-start" : "h-[92px]",
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Ingresos
              </p>
              <p className="mt-1.5 overflow-hidden whitespace-nowrap text-[clamp(1.2rem,1.75vw,2rem)] font-bold leading-none tracking-tight text-emerald-600 tabular-nums">
                {formatCurrency(totales?.ingresos.total ?? 0)}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-gray-500">
              {ingresosExpanded ? "Ocultar detalle" : "Ver detalle"}
              {ingresosExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </span>
          </div>

          {ingresosExpanded && (
            <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
              <div className="flex items-start justify-between gap-4 text-sm text-gray-600">
                <span>Cierres</span>
                <span className="max-w-[60%] overflow-hidden whitespace-nowrap text-right font-semibold leading-tight text-emerald-700 tabular-nums">
                  {formatCurrency(totales?.ingresos.cierres ?? 0)}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 text-sm text-gray-600">
                <span>Eventos</span>
                <span className="max-w-[60%] overflow-hidden whitespace-nowrap text-right font-semibold leading-tight text-green-700 tabular-nums">
                  {formatCurrency(totales?.ingresos.eventos ?? 0)}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 text-sm text-gray-600">
                <span>Consumos</span>
                <span className="max-w-[60%] overflow-hidden whitespace-nowrap text-right font-semibold leading-tight text-lime-700 tabular-nums">
                  {formatCurrency(totales?.ingresos.consumos ?? 0)}
                </span>
              </div>
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={() => setEgresosExpanded((current) => !current)}
          className={cn(
            "flex min-w-0 flex-col justify-start rounded-xl bg-white px-5 py-3 text-left shadow-sm transition hover:shadow-md",
            egresosExpanded ? "h-auto self-start" : "h-[92px]",
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Egresos
              </p>
              <p className="mt-1.5 overflow-hidden whitespace-nowrap text-[clamp(1.2rem,1.75vw,2rem)] font-bold leading-none tracking-tight text-red-500 tabular-nums">
                {formatCurrency(totales?.egresos.total ?? 0)}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-gray-500">
              {egresosExpanded ? "Ocultar detalle" : "Ver detalle"}
              {egresosExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </span>
          </div>

          {egresosExpanded && (
            <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
              <div className="flex items-start justify-between gap-4 text-sm text-gray-600">
                <span>Compras</span>
                <span className="max-w-[60%] overflow-hidden whitespace-nowrap text-right font-semibold leading-tight text-red-500 tabular-nums">
                  {formatCurrency(totales?.egresos.compras ?? 0)}
                </span>
              </div>
            </div>
          )}
        </button>

        <button
          type="button"
          className="flex h-[92px] min-w-0 flex-col justify-start rounded-xl bg-white px-5 py-3 text-left shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Total
              </p>
              <p
                className={cn(
                  "mt-1.5 overflow-hidden whitespace-nowrap text-[clamp(1.2rem,1.75vw,2rem)] font-bold leading-none tracking-tight tabular-nums",
                  totales?.total && totales.total >= 0
                    ? "text-blue-700"
                    : "text-red-600",
                )}
              >
                {formatCurrency(totales?.total ?? 0)}
              </p>
            </div>
            <span className="invisible inline-flex shrink-0 items-center gap-1 text-xs font-medium">
              Ver detalle
              <ChevronDown className="h-4 w-4" />
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
