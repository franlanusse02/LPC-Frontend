"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch, ApiError } from "@/lib/api";

type Cierre = {
  id: number;
  puntoDeVentaId: number;
  fechaOperacion: string;
  creadoPorId: number;
  totalPlatosVendidos: number;
  estado: string;
  comentarios?: string;
};

export default function HomePage() {
  const router = useRouter();
  const { session, isLoading } = useAuth();
  const [cierres, setCierres] = useState<Cierre[]>([]);
  const [loadingCierres, setLoadingCierres] = useState(true);

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/login");
    }
  }, [session, isLoading, router]);

  useEffect(() => {
    if (session) {
      apiFetch<Cierre[]>("/api/cierre", {}, session.token)
        .then((data) => setCierres(data))
        .then(() => setLoadingCierres(false));
    }
  }, [session]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-5xl px-6 py-6">
        <div className="flex flex-col items-center justify-center py-12 md:py-20 space-y-10">
          {/* Bienvenida */}
          <Card className="w-full max-w-md border-0 text-center shadow-md hover:shadow-lg transition">
            <CardContent className="p-10">
              <h1 className="mb-4 text-3xl font-bold uppercase tracking-wide">
                Bienvenido
              </h1>
              <p className="mb-6 text-lg text-muted-foreground">
                {session.usuario}
              </p>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="gap-2 px-10 text-sm font-bold uppercase tracking-wide"
              >
                <Link href="/nuevo-cierre">
                  <Plus className="h-4 w-4" />
                  Nuevo Cierre
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Listado de cierres */}
          <div className="w-full max-w-5xl">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold">
                  Cierres Previos
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {loadingCierres ? (
                  <div className="flex justify-center py-10">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : cierres.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No hay cierres previos
                  </p>
                ) : (
                  <table className="w-full table-auto border-collapse">
                    <thead>
                      <tr className="bg-muted text-left text-sm uppercase text-muted-foreground">
                        <th className="px-4 py-2">Fecha</th>
                        <th className="px-4 py-2">Total Platos</th>
                        <th className="px-4 py-2">Estado</th>
                        <th className="px-4 py-2">Comentarios</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cierres.map((cierre) => (
                        <tr
                          key={cierre.id}
                          className="border-t hover:bg-muted/10 transition cursor-pointer"
                        >
                          <td className="px-4 py-2">{cierre.fechaOperacion}</td>
                          <td className="px-4 py-2">
                            {cierre.totalPlatosVendidos}
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                cierre.estado === "ABIERTO"
                                  ? "bg-green-100 text-green-800"
                                  : cierre.estado === "CERRADO"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {cierre.estado}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            {cierre.comentarios || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
