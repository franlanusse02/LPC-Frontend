"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ComedorTable } from "@/components/comedores-table";
import { ComedorResponse } from "@/models/dto/comedor/ComedorResponse";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function ComedoresPage() {
  const [comedores, setComedores] = useState<ComedorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const { session, token, isLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.replace("/login");
      else if (session?.rol !== "ADMIN") router.replace("/");
      else fetchComedores();
    }
  }, [session, isLoading, router]);

  const fetchComedores = async () => {
    try {
      const data = await apiFetch<ComedorResponse[]>(
        "/api/comedor",
        {},
        token || "",
      );
      setComedores(data);
    } catch {
      toast({
        title: "Error al obtener comedores",
        description: "Por favor, intenta nuevamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreated = (comedor: ComedorResponse) => {
    setComedores((prev) => [...prev, comedor]);
    toast({
      title: "Comedor creado",
      description: `El comedor ${comedor.nombre} ha sido creado con exito`,
      variant: "default",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-2 text-gray-500 hover:text-gray-800"
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Volver a Menu Administrador
            </Link>
          </Button>
        </div>
        <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
          <CardContent>
            <CardHeader className="px-6 py-4 flex flex-row items-center">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Comedores</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Gestioná los comedores del sistema
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => setModalOpen(true)}
                className="ml-auto gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-wide transition hover:scale-105"
              >
                <Plus className="h-4 w-4" />
                Nuevo Comedor
              </Button>
            </CardHeader>
            <ComedorTable
              comedores={comedores}
              loading={loading}
              onCreated={handleCreated}
              setModalOpen={setModalOpen}
              modalOpen={modalOpen}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
