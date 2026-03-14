"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/header";
import { NuevoCierreForm } from "@/components/nuevo-cierre-form";
import {
  getComedores,
  getPuntosDeVenta,
  Comedor,
  PuntoDeVenta,
} from "@/lib/api";

export default function NuevoCierrePage() {
  const router = useRouter();
  const { session, isLoading, token } = useAuth();
  const [comedores, setComedores] = useState<Comedor[]>([]);
  const [puntosDeVenta, setPuntosDeVenta] = useState<PuntoDeVenta[]>([]);

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/login");
    }
  }, [session, isLoading, router]);

  useEffect(() => {
    async function fetchData() {
      if (!token) return;
      const fetchedComedores = await getComedores(token);
      const fetchedPuntos = await getPuntosDeVenta(token);
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
      <Header showBack />
      <main className="mx-auto max-w-4xl px-6 py-6">
        <NuevoCierreForm comedores={comedores} puntosDeVenta={puntosDeVenta} />
      </main>
    </div>
  );
}
