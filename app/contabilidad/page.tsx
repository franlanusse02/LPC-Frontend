"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { DetailedCierreCajaResponse } from "@/models/dto/cierre-caja/CierreCajaResponse";
import { AnularCierreModal } from "@/components/anular-cierre-modal";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/models/dto/ApiError";
import { CierresTable, CierresStats } from "@/components/cierres-table";

export default function ContabilidadPage() {
  const router = useRouter();
  const { session, isLoading, logout } = useAuth();
  const { toast } = useToast();

  const [cierres, setCierres] = useState<DetailedCierreCajaResponse[]>([]);
  const [loadingCierres, setLoadingCierres] = useState(true);

  const [anularModal, setAnularModal] = useState<{
    open: boolean;
    cierreId: number;
    fechaOperacion: string;
    puntoVenta: string;
    isAnulado: boolean;
  } | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.replace("/login");
      if (session?.rol === "ENCARGADO") router.replace("/cierres");
    }
  }, [session, isLoading, router]);

  useEffect(() => {
    if (session) {
      apiFetch<DetailedCierreCajaResponse[]>(
        "/api/cierre/detailed",
        {},
        session.token,
      )
        .then(setCierres)
        .finally(() => setLoadingCierres(false));
    }
  }, [session]);

  const handleAnular = async (cierreId: number, motivo: string) => {
    if (!session) return;
    const cierre = cierres.find((c) => c.id === cierreId);
    if (!cierre) return;
    const isAnulado = cierre.anulacionId !== null;

    try {
      await apiFetch(
        `/api/cierre/${cierreId}/anular`,
        { method: "POST", body: JSON.stringify({ motivo }) },
        session.token,
      );
      setCierres((prev) =>
        prev.map((c) =>
          c.id !== cierreId
            ? c
            : {
                ...c,
                anulacionId: isAnulado ? null : cierreId,
                montoTotal: 0,
                movimientos:
                  c.movimientos!.map((m) => ({
                    ...m,
                    anulacionId: isAnulado ? null : cierreId,
                  })) || [],
              },
        ),
      );
      toast({
        title: isAnulado ? "Cierre reactivado" : "Cierre anulado",
        description: isAnulado
          ? "El cierre fue reactivado correctamente."
          : "El cierre fue anulado correctamente.",
      });
    } catch (err) {
      if (ApiError.isUnauthorized(err)) {
        logout();
        router.replace("/login");
        return;
      }
      toast({
        variant: "destructive",
        title: "Error",
        description:
          err instanceof ApiError
            ? err.message
            : "No se pudo completar la operación.",
      });
      throw err;
    }
  };

  const openAnularModal = (cierre: DetailedCierreCajaResponse) => {
    setAnularModal({
      open: true,
      cierreId: cierre.id,
      fechaOperacion: cierre.fechaOperacion,
      puntoVenta: cierre.puntoDeVenta.nombre,
      isAnulado: cierre.anulacionId !== null,
    });
  };

  const closeAnularModal = () =>
    setAnularModal((prev) => prev && { ...prev, open: false });

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

      <main className="mx-auto max-w-7xl px-6 py-10 space-y-6">
        {!loadingCierres && cierres.length > 0 && (
          <CierresStats cierres={cierres} />
        )}

        <Card className="border-0 shadow-md rounded-xl">
          <CardHeader className="border-b px-6 py-4">
            <CardTitle className="text-xl font-bold text-gray-800">
              Contabilidad
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <CierresTable
              cierres={cierres}
              loading={loadingCierres}
              onEditar={(id) =>
                router.push(`/contabilidad/editar-cierre?id=${id}`)
              }
              onAnular={openAnularModal}
            />
          </CardContent>
        </Card>
      </main>

      {anularModal && (
        <AnularCierreModal
          open={anularModal.open}
          onClose={closeAnularModal}
          cierreId={anularModal.cierreId}
          fechaOperacion={anularModal.fechaOperacion}
          puntoVenta={anularModal.puntoVenta}
          onConfirm={handleAnular}
        />
      )}
    </div>
  );
}
