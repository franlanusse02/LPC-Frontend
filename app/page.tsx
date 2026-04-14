
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/header";
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
  ClipboardList,
  Utensils,
  ShoppingCart,
  UserPlus,
  Building2,
  Truck,
  Landmark,
  Tag,
  Building,
  DoorOpen,
  Package2,
  UsersRound,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { session, isLoading } = useAuth();
  const configButtonClass =
    "flex h-20 w-full flex-col items-center justify-center gap-2 rounded-lg border-gray-200 px-3 hover:border-gray-300 hover:bg-gray-50 sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)]";

  useEffect(() => {
    if (!isLoading) {
      if (!session) {
        router.replace("/login");
      }
      if (session?.rol === "ENCARGADO") {
        router.replace("/encargado");
      } else if (session?.rol === "CONTABILIDAD") {
        router.replace("/contabilidad");
      }
    }
  }, [session, isLoading, router]);

  if (isLoading && session?.rol === "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
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
          <CardContent className="grid grid-cols-2 gap-3 p-4">
            <Button
              variant="outline"
              onClick={() => router.push("/contabilidad")}
              className="flex items-center justify-start gap-3 h-14 px-4 rounded-lg border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <BarChart3 className="h-5 w-5 text-gray-500 shrink-0" />
              <span className="text-sm font-medium text-gray-700">Panel Contabilidad</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/encargado")}
              className="flex items-center justify-start gap-3 h-14 px-4 rounded-lg border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <ClipboardList className="h-5 w-5 text-gray-500 shrink-0" />
              <span className="text-sm font-medium text-gray-700">Panel Encargado</span>
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
          <CardContent className="flex flex-wrap justify-center gap-3 p-4">
            <Button
              variant="outline"
              onClick={() => router.push("/comedores")}
              className={configButtonClass}
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
              onClick={() => router.push("/puntos-de-venta")}
              className={configButtonClass}
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
              onClick={() => router.push("/usuarios")}
              className={configButtonClass}
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
              onClick={() => router.push("/sociedades")}
              className={configButtonClass}
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
              onClick={() => router.push("/proveedores")}
              className={configButtonClass}
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
              onClick={() => router.push("/productos-consumo")}
              className={configButtonClass}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100">
                <Package2 className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-center text-xs font-medium leading-tight text-gray-700">
                Productos
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/consumidores")}
              className={configButtonClass}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100">
                <UsersRound className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-center text-xs font-medium leading-tight text-gray-700">
                Consumidores
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/bancos")}
              className={configButtonClass}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100">
                <Landmark className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-center text-xs font-medium leading-tight text-gray-700">
                Bancos
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/tipos-evento")}
              className={configButtonClass}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100">
                <Tag className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-center text-xs font-medium leading-tight text-gray-700">
                Tipos de Evento
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/edificios")}
              className={configButtonClass}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100">
                <Building className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-center text-xs font-medium leading-tight text-gray-700">
                Edificios Eventos
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/salas")}
              className={configButtonClass}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100">
                <DoorOpen className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-center text-xs font-medium leading-tight text-gray-700">
                Salas Eventos
              </span>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
