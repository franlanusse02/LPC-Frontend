import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  CalendarPlus,
  PackagePlus,
  ClipboardList,
  BanknoteArrowUp,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { KpiCard } from "@/components/KpiCard";
import { ModuleButtonGrid, type ModuleButton } from "@/modules/analytics/components/ModuleButtonGrid";
import {
  ListFilters,
  type ListFilterState,
} from "@/components/ListFilters";
import { defaultFilters } from "@/components/list-filter-defaults";
import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";

const ACCESO_ITEMS: ModuleButton[] = [
  { icon: BanknoteArrowUp, label: "Cargar Cierres", to: "/encargado/cierres" },
  { icon: PackagePlus, label: "Cargar Compras", to: "/encargado/compras" },
  { icon: CalendarPlus, label: "Cargar Eventos", to: "/encargado/eventos" },
  { icon: ClipboardList, label: "Cargar Consumos", to: "/encargado/consumos" },
];

export default function EncargadoDashboard() {
  const { get } = useApi();

  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [filters, setFilters] = useState<ListFilterState>(defaultFilters);

  useEffect(() => {
    get("/comedores")
      .then((r) => r.json())
      .then(setComedores);
  }, [get]);

  const analyticsFilters = useMemo(
    () => ({
      fechaInicio: filters.desde || undefined,
      fechaFin: filters.hasta || undefined,
      comedorId: filters.comedorId || undefined,
      puntoDeVentaIds: filters.puntoDeVentaIds.length ? filters.puntoDeVentaIds : undefined,
    }),
    [filters],
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-4xl px-6 py-10 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard
            title="Mis Ingresos"
            endpoint="/analytics/mis-totales"
            filters={analyticsFilters}
            format="currency"
            valueExtractor={(d: unknown) => {
              const obj = d as Record<string, Record<string, number>>;
              return obj?.ingresos?.total ?? 0;
            }}
            accent="emerald"
          />
          <KpiCard
            title="Mis Egresos"
            endpoint="/analytics/mis-totales"
            filters={analyticsFilters}
            format="currency"
            valueExtractor={(d: unknown) => {
              const obj = d as Record<string, Record<string, number>>;
              return obj?.egresos?.total ?? 0;
            }}
            accent="red"
          />
          <KpiCard
            title="Mi % Compra"
            endpoint="/analytics/mi-porcentaje-compra"
            filters={analyticsFilters}
            format="percentage"
            valueExtractor={(d: unknown) => {
              const obj = d as Record<string, number>;
              return obj?.porcentaje ?? 0;
            }}
            accent="blue"
          />
        </div>

        <div className="rounded-xl bg-white px-5 py-4 shadow-sm">
          <ListFilters
            filters={filters}
            onChange={setFilters}
            comedores={comedores}
            showSociedad={false}
            showComedor={false}
          />
        </div>

        <Card className="border border-gray-200 shadow-sm rounded-xl">
          <CardHeader className="border-b px-6 py-4">
            <CardTitle className="text-lg font-semibold text-gray-800">
              Acceso Encargado
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Elegí un módulo para cargar datos
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <ModuleButtonGrid items={ACCESO_ITEMS} layout="row" />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
