import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarPlus,
  PackagePlus,
  ClipboardList,
  BanknoteArrowUp,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { KpiCard } from "@/components/KpiCard";
import {
  ListFilters,
  type ListFilterState,
} from "@/components/ListFilters";
import { defaultFilters } from "@/components/list-filter-defaults";
import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";

export default function EncargadoDashboard() {
  const navigate = useNavigate();
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
      puntoDeVentaId: filters.puntoDeVentaId || undefined,
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
          <CardContent className="p-4 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/encargado/cierres")}
              className="flex items-center justify-start gap-3 h-14 px-4 rounded-lg border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <BanknoteArrowUp className="h-5 w-5 text-gray-500 shrink-0" />
              <span className="text-sm font-medium text-gray-700">
                Cargar Cierres
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/encargado/compras")}
              className="flex items-center justify-start gap-3 h-14 px-4 rounded-lg border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <PackagePlus className="h-5 w-5 text-gray-500 shrink-0" />
              <span className="text-sm font-medium text-gray-700">
                Cargar Compras
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/encargado/eventos")}
              className="flex items-center justify-start gap-3 h-14 px-4 rounded-lg border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <CalendarPlus className="h-5 w-5 text-gray-500 shrink-0" />
              <span className="text-sm font-medium text-gray-700">
                Cargar Eventos
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/encargado/consumos")}
              className="flex items-center justify-start gap-3 h-14 px-4 rounded-lg border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <ClipboardList className="h-5 w-5 text-gray-500 shrink-0" />
              <span className="text-sm font-medium text-gray-700">
                Cargar Consumos
              </span>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
