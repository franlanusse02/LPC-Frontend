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
  BarChart3,
  Building2,
  ClipboardList,
  Landmark,
  Package2,
  ShoppingCart,
  Tag,
  Truck,
  UserPlus,
  Utensils,
  UsersRound,
  Hand,
} from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-2xl px-6 py-10 space-y-6">
        <Card className="border border-gray-200 shadow-sm rounded-xl">
          <CardHeader className="border-b px-6 py-4">
            <CardTitle className="text-lg font-semibold text-gray-800">
              Menú Administrador
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Podés elegir cómo ver el sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/contabilidad")}
              className="flex items-center justify-start gap-3 h-14 px-4 rounded-lg border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <BarChart3 className="h-5 w-5 text-gray-500 shrink-0" />
              <span className="text-sm font-medium text-gray-700">
                Vista Contabilidad
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/encargado")}
              className="flex items-center justify-start gap-3 h-14 px-4 rounded-lg border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <ClipboardList className="h-5 w-5 text-gray-500 shrink-0" />
              <span className="text-sm font-medium text-gray-700">
                Vista Encargado
              </span>
            </Button>
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
          <CardContent className="p-4 grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/sociedades")}
              className="flex flex-col items-center justify-center gap-2 h-20 px-3 rounded-lg border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100">
                <Building2 className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                Sociedades
              </span>
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate("/catalogo/comedores")}
              className="flex flex-col items-center justify-center gap-2 h-20 px-3 rounded-lg border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100">
                <Utensils className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                Comedores
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/catalogo/puntos-de-venta")}
              className="flex flex-col items-center justify-center gap-2 h-20 px-3 rounded-lg border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100">
                <ShoppingCart className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                Puntos de Venta
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/usuarios")}
              className="flex flex-col items-center justify-center gap-2 h-20 px-3 rounded-lg border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100">
                <UserPlus className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                Usuarios
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/catalogo/productos")}
              className="flex flex-col items-center justify-center gap-2 h-20 px-3 rounded-lg border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100">
                <Package2 className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                Productos
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/catalogo/consumidores")}
              className="flex flex-col items-center justify-center gap-2 h-20 px-3 rounded-lg border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100">
                <UsersRound className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                Consumidores
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/catalogo/proveedores")}
              className="flex flex-col items-center justify-center gap-2 h-20 px-3 rounded-lg border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100">
                <Truck className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                Proveedores
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/catalogo/bancos")}
              className="flex flex-col items-center justify-center gap-2 h-20 px-3 rounded-lg border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100">
                <Landmark className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                Bancos
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/catalogo/tipos-eventos")}
              className="flex flex-col items-center justify-center gap-2 h-20 px-3 rounded-lg border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100">
                <Tag className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                Tipos de Evento
              </span>
            </Button>
            <Button
              variant="outline"
              disabled
              className="flex flex-col items-center justify-center gap-2 h-20 px-3 rounded-lg border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100">
                <Hand className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                Empleados
              </span>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
