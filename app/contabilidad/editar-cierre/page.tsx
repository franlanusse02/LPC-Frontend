"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/header";
import { apiFetch } from "@/lib/api";
import { EditCierreForm } from "@/components/edit-cierre-form";
import { ComedorResponse } from "@/models/dto/comedor/ComedorResponse";
import { PuntoDeVentaResponse } from "@/models/dto/pto-venta/PuntoDeVentaResponse";
import { DetailedCierreCajaResponse } from "@/models/dto/cierre-caja/CierreCajaResponse";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function EditarCierrePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <EditarCierrePageInner />
    </Suspense>
  );
}

function EditarCierrePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const cierreId = searchParams.get("id") as string;
  const { session, isLoading } = useAuth();

  const [cierre, setCierre] = useState<DetailedCierreCajaResponse | null>(null);
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [puntosDeVenta, setPuntosDeVenta] = useState<PuntoDeVentaResponse[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.replace("/login");
      if (session?.rol === "ENCARGADO") router.replace("/encargado");
    }
  }, [session, isLoading, router]);

  useEffect(() => {
    if (!session || !cierreId) return;

    const { token } = session;

    Promise.all([
      apiFetch<DetailedCierreCajaResponse>(
        `/api/cierres/detailed/${cierreId}`,
        {},
        token,
      ),
      apiFetch<ComedorResponse[]>("/api/comedores", {}, token),
      apiFetch<PuntoDeVentaResponse[]>("/api/comedores/puntos-de-venta", {}, token),
    ])
      .then(([cierreData, comedoresData, puntosData]) => {
        setCierre(cierreData);
        setComedores(comedoresData);
        setPuntosDeVenta(puntosData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session, cierreId]);

  if (isLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session || !cierre) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Back navigation */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-2 text-gray-500 hover:text-gray-800"
          >
            <Link href="/contabilidad">
              <ArrowLeft className="h-4 w-4" />
              Volver a Contabilidad
            </Link>
          </Button>
        </div>

        <EditCierreForm
          cierre={cierre}
          comedores={comedores}
          puntosDeVenta={puntosDeVenta}
        />
      </main>
    </div>
  );
}
