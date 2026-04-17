"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/header";
import { NuevoCierreForm } from "@/components/nuevo-cierre-form";
import { apiFetch } from "@/lib/api";
import { ComedorResponse } from "@/models/dto/comedor/ComedorResponse";
import { PuntoDeVentaResponse } from "@/models/dto/pto-venta/PuntoDeVentaResponse";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NuevoCierrePage() {
  const router = useRouter();
  const { session, isLoading, token } = useAuth();
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [puntosDeVenta, setPuntosDeVenta] = useState<PuntoDeVentaResponse[]>(
    [],
  );

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/login");
    }
  }, [session, isLoading, router]);

  useEffect(() => {
    async function fetchData() {
      if (!token) return;
      const fetchedComedores = await apiFetch<ComedorResponse[]>(
        "/api/comedores",
        {},
        token,
      );
      const fetchedPuntos = await apiFetch<PuntoDeVentaResponse[]>(
        "/api/comedores/puntos-de-venta",
        {},
        token,
      );
      setComedores(fetchedComedores);
      setPuntosDeVenta(fetchedPuntos);
    }
    fetchData();
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-2 text-gray-500 hover:text-gray-800"
          >
            <Link href="/encargado">
              <ArrowLeft className="h-4 w-4" />
              Volver al Menu de Encargado
            </Link>
          </Button>
        </div>
        <NuevoCierreForm comedores={comedores} puntosDeVenta={puntosDeVenta} />
      </main>
    </div>
  );
}
