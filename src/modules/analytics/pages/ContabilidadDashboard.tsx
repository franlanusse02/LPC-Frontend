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
  Utensils,
  ShoppingCart,
  Package2,
  PackageSearch,
  UsersRound,
  Truck,
  Landmark,
  FileSpreadsheet,
  Hand,
  FileText,
  FolderTree,
  BookOpen,
} from "lucide-react";
import TotalesContabilidad from "@/modules/analytics/components/totales";
import { ModuleButtonGrid, type ModuleButton } from "@/modules/analytics/components/ModuleButtonGrid";
import {
  ListFilters,
  type ListFilterState,
} from "@/components/ListFilters";
import { defaultFilters } from "@/components/list-filter-defaults";
import { useApi } from "@/hooks/useApi";
import type { ComedorResponse } from "@/domain/dto/comedor/ComedorResponse";
import type { SociedadResponse } from "@/domain/dto/sociedad/SociedadResponse";

const ACCESO_ITEMS: ModuleButton[] = [
  { icon: BanknoteArrowUp, label: "Ver Cierres", to: "/contabilidad/cierres" },
  { icon: PackagePlus, label: "Ver Compras", to: "/contabilidad/compras" },
  { icon: CalendarPlus, label: "Ver Eventos", to: "/contabilidad/eventos" },
  { icon: ClipboardList, label: "Ver Consumos", to: "/contabilidad/consumos" },
];

const CONFIG_ITEMS: ModuleButton[] = [
  { icon: Utensils, label: "Comedores", to: "/catalogo/comedores" },
  { icon: ShoppingCart, label: "Puntos de Venta", to: "/catalogo/puntos-de-venta" },
  { icon: Package2, label: "Productos", to: "/catalogo/productos" },
  { icon: UsersRound, label: "Consumidores", to: "/catalogo/consumidores" },
  { icon: Truck, label: "Proveedores", to: "/catalogo/proveedores" },
  { icon: PackageSearch, label: "Artículos Proveedor", to: "/catalogo/proveedor-items" },
  { icon: Landmark, label: "Bancos", to: "/catalogo/bancos" },
  { icon: FolderTree, label: "Centros de Costo", to: "/catalogo/centros-costo" },
  { icon: BookOpen, label: "Partidas", to: "/catalogo/partidas" },
  { icon: Hand, label: "Empleados Comedor", to: "/catalogo/empleados" },
  { icon: FileText, label: "Razones Sociales", to: "/catalogo/razones-sociales" },
  { icon: FileSpreadsheet, label: "Importar Excel", to: "/contabilidad/importar" },
];

export default function ContabilidadDashboard() {
  const { get } = useApi();

  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [sociedades, setSociedades] = useState<SociedadResponse[]>([]);
  const [filters, setFilters] = useState<ListFilterState>(defaultFilters);

  useEffect(() => {
    Promise.all([get("/comedores"), get("/sociedades")]).then(
      ([comedoresRes, sociedadesRes]) => {
        comedoresRes.json().then(setComedores);
        sociedadesRes.json().then(setSociedades);
      },
    );
  }, [get]);

  const analyticsFilters = useMemo(
    () => ({
      fechaInicio: filters.desde || undefined,
      fechaFin: filters.hasta || undefined,
      comedorId: filters.comedorId || undefined,
      sociedadId: filters.sociedadId || undefined,
      puntoDeVentaId: filters.puntoDeVentaId || undefined,
    }),
    [filters],
  );

  return (
    <div>
      <TotalesContabilidad filters={analyticsFilters} />

      <div className="mx-auto max-w-4xl px-6 pt-4 pb-2">
        <div className="rounded-xl bg-white px-5 py-4 shadow-sm">
          <ListFilters
            filters={filters}
            onChange={setFilters}
            comedores={comedores}
            sociedades={sociedades}
          />
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-6 py-6 space-y-6">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="border-b px-6 py-4">
            <CardTitle className="text-lg font-semibold text-gray-800">
              Acceso Contabilidad
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Elegí un módulo para analizar datos
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <ModuleButtonGrid items={ACCESO_ITEMS} layout="row" />
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm rounded-xl">
          <CardHeader className="border-b px-6 py-4">
            <CardTitle className="text-lg font-semibold text-gray-800">
              Configuraciones
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Podés crear datos estáticos del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <ModuleButtonGrid items={CONFIG_ITEMS} layout="tile" />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
