"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { ComedorResponse } from "@/models/dto/comedor/ComedorResponse";
import { ConsumidorResponse } from "@/models/dto/consumos/ConsumidorResponse";
import { ConsumidoresTable } from "@/components/consumidores-table";
import { BackButton } from "@/components/back-button";

export default function ConsumidoresPage() {
  const [consumidores, setConsumidores] = useState<ConsumidorResponse[]>([]);
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const { session, token, isLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.replace("/login");
      else if (session.rol !== "ADMIN" && session.rol !== "CONTABILIDAD")
        router.replace("/");
      else fetchAll();
    }
  }, [isLoading, router, session]);

  const fetchAll = async () => {
    try {
      const [consumidoresData, comedoresData] = await Promise.all([
        apiFetch<ConsumidorResponse[]>(
          "/api/consumos/consumidor/all",
          {},
          token || "",
        ),
        apiFetch<ComedorResponse[]>("/api/comedor", {}, token || ""),
      ]);
      setConsumidores(consumidoresData);
      setComedores(comedoresData);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron obtener los consumidores.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6">
          <BackButton
            fallbackHref={session?.rol === "ADMIN" ? "/" : "/contabilidad/catalogo"}
          />
        </div>

        <Card className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
          <CardContent>
            <CardHeader className="flex flex-row items-center px-6 py-4">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                  Consumidores
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Gestioná los consumidores habilitados para registrar consumos
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => setModalOpen(true)}
                className="ml-auto gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-wide transition hover:scale-105"
              >
                <Plus className="h-4 w-4" />
                Nuevo Consumidor
              </Button>
            </CardHeader>

            <ConsumidoresTable
              consumidores={consumidores}
              comedores={comedores}
              loading={loading}
              onCreated={(consumidor) =>
                setConsumidores((prev) => [...prev, consumidor])
              }
              onUpdated={(consumidor) =>
                setConsumidores((prev) =>
                  prev.map((item) =>
                    item.id === consumidor.id ? consumidor : item,
                  ),
                )
              }
              onDeleted={(consumidorId) =>
                setConsumidores((prev) =>
                  prev.filter((item) => item.id !== consumidorId),
                )
              }
              modalOpen={modalOpen}
              setModalOpen={setModalOpen}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
