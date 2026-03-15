"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { CierreCajaResponse } from "@/models/dto/cierre-caja/CierreCajaResponse";

export default function HomePage() {
  const router = useRouter();
  const { session, isLoading } = useAuth();
  const [cierres, setCierres] = useState<CierreCajaResponse[]>([]);
  const [loadingCierres, setLoadingCierres] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!session) {
        router.replace("/login");
      }
      if (session?.rol === "CONTABILIDAD") {
        router.replace("/contabilidad");
      }
    }
  }, [session, isLoading, router]);

  useEffect(() => {
    if (session) {
      apiFetch<CierreCajaResponse[]>("/api/cierre", {}, session.token)
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
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Cierres Section */}
        <section>
          <Card className="border-0 shadow-md rounded-xl">
            <CardHeader className="flex items-center justify-between border-b px-6 py-4">
              <CardTitle className="text-xl font-bold text-gray-800">
                Cierres Previos
              </CardTitle>
              <Button
                asChild
                size="sm"
                className="gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-wide transition hover:scale-105"
              >
                <Link href="/nuevo-cierre" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo Cierre
                </Link>
              </Button>
            </CardHeader>

            <CardContent className="overflow-x-auto">
              {loadingCierres ? (
                <div className="flex justify-center py-12">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : cierres.length === 0 ? (
                <p className="text-center text-gray-500 py-6">
                  No hay cierres previos
                </p>
              ) : (
                <table className="w-full table-auto border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-left uppercase text-gray-600 tracking-wide">
                      <th className="px-6 py-3">Fecha</th>
                      <th className="px-6 py-3">Total Platos</th>
                      <th className="px-6 py-3">Monto Total</th>
                      <th className="px-6 py-3">Comentarios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cierres.map((cierre) => (
                      <tr
                        key={cierre.id}
                        className="border-b hover:bg-gray-50 transition cursor-pointer"
                      >
                        <td className="px-6 py-4">{cierre.fechaOperacion}</td>
                        <td className="px-6 py-4">
                          {cierre.totalPlatosVendidos}
                        </td>
                        <td className="px-6 py-4">
                          {new Intl.NumberFormat("es-CL", {
                            style: "currency",
                            currency: "ARS",
                            minimumFractionDigits: 0,
                          }).format(cierre.montoTotal)}
                        </td>
                        <td className="px-6 py-4">
                          {cierre.comentarios || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
