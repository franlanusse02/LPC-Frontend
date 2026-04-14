"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building,
  DoorOpen,
  Landmark,
  Package2,
  ShoppingCart,
  Tag,
  Truck,
  Utensils,
  UsersRound,
} from "lucide-react";
import { Header } from "@/components/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { BackButton } from "@/components/back-button";

const tileClass =
  "flex h-24 w-full flex-col items-center justify-center gap-2 rounded-lg border-gray-200 px-3 hover:border-gray-300 hover:bg-gray-50 sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)]";

export default function CatalogoPage() {
  const router = useRouter();
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!session) {
        router.replace("/login");
      } else if (session.rol !== "ADMIN" && session.rol !== "CONTABILIDAD") {
        router.replace("/");
      }
    }
  }, [isLoading, router, session]);

  if (isLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6">
          <BackButton fallbackHref="/contabilidad" />
        </div>

        <Card className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
          <CardHeader className="border-b px-6 py-4">
            <CardTitle className="text-xl font-bold text-gray-800">
              Catálogo
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Crea y edita datos del catálogo.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap justify-center gap-3 p-4">
            <Button
              variant="outline"
              onClick={() => router.push("/puntos-de-venta")}
              className={tileClass}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100">
                <ShoppingCart className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-center text-sm font-medium leading-tight text-gray-700">
                Puntos de Venta
              </span>
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push("/comedores")}
              className={tileClass}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100">
                <Utensils className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-center text-sm font-medium leading-tight text-gray-700">
                Comedores
              </span>
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push("/proveedores")}
              className={tileClass}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100">
                <Truck className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-center text-sm font-medium leading-tight text-gray-700">
                Proveedores
              </span>
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push("/productos-consumo")}
              className={tileClass}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100">
                <Package2 className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-center text-sm font-medium leading-tight text-gray-700">
                Productos
              </span>
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push("/consumidores")}
              className={tileClass}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100">
                <UsersRound className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-center text-sm font-medium leading-tight text-gray-700">
                Consumidores
              </span>
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push("/bancos")}
              className={tileClass}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100">
                <Landmark className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-center text-sm font-medium leading-tight text-gray-700">
                Bancos
              </span>
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push("/tipos-evento")}
              className={tileClass}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100">
                <Tag className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-center text-sm font-medium leading-tight text-gray-700">
                Tipos de Evento
              </span>
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push("/edificios")}
              className={tileClass}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100">
                <Building className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-center text-sm font-medium leading-tight text-gray-700">
                Edificios Eventos
              </span>
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push("/salas")}
              className={tileClass}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100">
                <DoorOpen className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-center text-sm font-medium leading-tight text-gray-700">
                Salas Eventos
              </span>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
