"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PuntoDeVentaTable } from "@/components/puntos-de-venta-table";
import { PuntoDeVentaResponse } from "@/models/dto/pto-venta/PuntoDeVentaResponse";
import { ComedorResponse } from "@/models/dto/comedor/ComedorResponse";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { BackButton } from "@/components/back-button";

export default function PuntosDeVentaPage() {
  const [puntosDeVenta, setPuntosDeVenta] = useState<PuntoDeVentaResponse[]>(
    [],
  );
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const { session, token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.replace("/login");
      else if (session.rol !== "ADMIN" && session.rol !== "CONTABILIDAD")
        router.replace("/");
      else fetchAll();
    }
  }, [session, isLoading, router]);

  const fetchAll = async () => {
    try {
      const [puntosData, comedoresData] = await Promise.all([
        apiFetch<PuntoDeVentaResponse[]>("/api/comedores/puntos-de-venta", {}, token || ""),
        apiFetch<ComedorResponse[]>("/api/comedores", {}, token || ""),
      ]);
      setPuntosDeVenta(puntosData);
      setComedores(comedoresData);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleCreated = (punto: PuntoDeVentaResponse) => {
    setPuntosDeVenta((prev) => [...prev, punto]);
  };

  const handleUpdated = (punto: PuntoDeVentaResponse) => {
    setPuntosDeVenta((prev) => prev.map((p) => p.id === punto.id ? punto : p));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-6">
          <BackButton
            fallbackHref={session?.rol === "ADMIN" ? "/" : "/contabilidad/catalogo"}
          />
        </div>
        <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
          <CardContent>
            <CardHeader className="px-6 py-4 flex flex-row items-center">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                  Puntos de Venta
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Gestioná los puntos de venta del sistema
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => setModalOpen(true)}
                className="ml-auto gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-wide transition hover:scale-105"
              >
                <Plus className="h-4 w-4" />
                Nuevo Punto de Venta
              </Button>
            </CardHeader>
            <PuntoDeVentaTable
              puntosDeVenta={puntosDeVenta}
              comedores={comedores}
              loading={loading}
              onCreated={handleCreated}
              onUpdated={handleUpdated}
              setModalOpen={setModalOpen}
              modalOpen={modalOpen}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
