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
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!session) {
        router.replace("/login");
      }
      if (session?.rol === "ENCARGADO") {
        router.replace("/cierres");
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
        {/* Admin Menu */}
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
              onClick={() => router.push("/contabilidad")}
              className="flex items-center justify-start gap-3 h-14 px-4 rounded-lg border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <BarChart3 className="h-5 w-5 text-gray-500 shrink-0" />
              <span className="text-sm font-medium text-gray-700">
                Panel Contabilidad
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/cierres")}
              className="flex items-center justify-start gap-3 h-14 px-4 rounded-lg border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <ClipboardList className="h-5 w-5 text-gray-500 shrink-0" />
              <span className="text-sm font-medium text-gray-700">
                Panel Cierres
              </span>
            </Button>
          </CardContent>
        </Card>

        {/* Configuraciones */}
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
              onClick={() => router.push("/comedores")}
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
              onClick={() => router.push("/puntos-de-venta")}
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
              onClick={() => router.push("/usuarios")}
              className="flex flex-col items-center justify-center gap-2 h-20 px-3 rounded-lg border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100">
                <UserPlus className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                Nuevo Usuario
              </span>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
