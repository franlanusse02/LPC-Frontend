"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { DetailedCierreCajaResponse } from "@/models/dto/cierre-caja/CierreCajaResponse";
import { MovimientoResponse } from "@/models/dto/movimiento/MovimientoResponse";
import { AnularModal } from "@/components/anular-modal";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/models/dto/ApiError";
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Ban,
  RotateCcw,
  Pencil,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ContabilidadPage() {
  const router = useRouter();
  const { session, isLoading, logout } = useAuth();
  const { toast } = useToast();

  const [cierres, setCierres] = useState<DetailedCierreCajaResponse[]>([]);
  const [loadingCierres, setLoadingCierres] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Anular modal state
  const [anularModal, setAnularModal] = useState<{
    open: boolean;
    cierreId: number;
    fechaOperacion: string;
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
        "/api/cierre?detailed=true",
        {},
        session.token,
      )
        .then((data) => {
          setCierres(data);
        })
        .finally(() => setLoadingCierres(false));
    }
  }, [session]);

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAnularDesanular = async (cierreId: number) => {
    if (!session) return;
    const cierre = cierres.find((c) => c.id === cierreId);
    if (!cierre) return;

    const isAnulado = cierre.anulacionId !== null;
    const endpoint = isAnulado
      ? `/api/cierre/${cierreId}/desanular`
      : `/api/cierre/${cierreId}/anular`;

    try {
      await apiFetch(endpoint, { method: "POST" }, session.token);

      // Optimistically update local state
      setCierres((prev) =>
        prev.map((c) => {
          if (c.id !== cierreId) return c;
          return {
            ...c,
            anulacionId: isAnulado ? null : cierreId, // toggle
          };
        }),
      );

      toast({
        title: isAnulado ? "Cierre desanulado" : "Cierre anulado",
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
      throw err; // re-throw so modal can handle loading state
    }
  };

  const openAnularModal = (cierre: DetailedCierreCajaResponse) => {
    setAnularModal({
      open: true,
      cierreId: cierre.id,
      fechaOperacion: cierre.fechaOperacion,
      isAnulado: cierre.anulacionId !== null,
    });
  };

  const closeAnularModal = () => {
    setAnularModal((prev) => prev && { ...prev, open: false });
  };

  const handleEditar = (cierreId: number) => {
    router.push(`/contabilidad/editar-cierre?id=${cierreId}`);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount);

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
        <section>
          <Card className="border-0 shadow-md rounded-xl">
            <CardHeader className="flex items-center justify-between border-b px-6">
              <CardTitle className="text-xl font-bold text-gray-800">
                Contabilidad
              </CardTitle>
            </CardHeader>

            <CardContent className="overflow-x-auto p-0">
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
                    <tr className="bg-gray-100 text-left text-xs uppercase text-gray-500 tracking-wider">
                      {/* expand chevron */}
                      <th className="px-4 py-3 w-8" />
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Comedor</th>
                      <th className="px-4 py-3">Punto de Venta</th>
                      <th className="px-4 py-3 text-center">Total Platos</th>
                      <th className="px-4 py-3 text-right">Monto Total</th>
                      <th className="px-4 py-3 text-center">Estado</th>
                      <th className="px-4 py-3">Comentarios</th>
                      {/* actions */}
                      <th className="px-4 py-3 w-12" />
                    </tr>
                  </thead>
                  <tbody>
                    {cierres.map((cierre) => {
                      const isExpanded = expandedRows.has(cierre.id);
                      const isAnulado = cierre.anulacionId !== null;
                      const movimientos: MovimientoResponse[] =
                        cierre.movimientos ?? [];

                      return (
                        <Fragment key={cierre.id}>
                          <tr
                            className={cn(
                              "border-b transition-colors",
                              isAnulado
                                ? "bg-red-50/40 text-gray-400"
                                : "hover:bg-gray-50/80",
                            )}
                          >
                            {/* Expand toggle */}
                            <td
                              className="px-4 py-4 cursor-pointer text-gray-400 hover:text-gray-600"
                              onClick={() => toggleRow(cierre.id)}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </td>

                            <td
                              className="px-4 py-4 font-medium cursor-pointer whitespace-nowrap"
                              onClick={() => toggleRow(cierre.id)}
                            >
                              {cierre.fechaOperacion}
                            </td>
                            <td
                              className="px-4 py-4 cursor-pointer"
                              onClick={() => toggleRow(cierre.id)}
                            >
                              {cierre.comedor.nombre}
                            </td>
                            <td
                              className="px-4 py-4 cursor-pointer"
                              onClick={() => toggleRow(cierre.id)}
                            >
                              {cierre.puntoDeVenta.nombre}
                            </td>
                            <td
                              className="px-4 py-4 text-center cursor-pointer"
                              onClick={() => toggleRow(cierre.id)}
                            >
                              {cierre.totalPlatosVendidos}
                            </td>
                            <td
                              className="px-4 py-4 text-right font-mono cursor-pointer"
                              onClick={() => toggleRow(cierre.id)}
                            >
                              {formatCurrency(cierre.montoTotal)}
                            </td>

                            {/* Estado badge */}
                            <td
                              className="px-4 py-4 text-center cursor-pointer"
                              onClick={() => toggleRow(cierre.id)}
                            >
                              {isAnulado ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600">
                                  <Ban className="h-3 w-3" />
                                  Anulado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                                  Activo
                                </span>
                              )}
                            </td>

                            <td
                              className="px-4 py-4 text-gray-500 cursor-pointer max-w-[160px] truncate"
                              onClick={() => toggleRow(cierre.id)}
                            >
                              {cierre.comentarios || (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-4">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 data-[state=open]:bg-gray-100"
                                    aria-label="Acciones"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-44 rounded-xl shadow-lg border-gray-100"
                                >
                                  <DropdownMenuItem
                                    onClick={() => handleEditar(cierre.id)}
                                    className="gap-2.5 cursor-pointer rounded-lg text-gray-700 focus:text-gray-900"
                                  >
                                    <Pencil className="h-4 w-4 text-gray-400" />
                                    Editar
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator className="my-1" />

                                  <DropdownMenuItem
                                    onClick={() => openAnularModal(cierre)}
                                    className={cn(
                                      "gap-2.5 cursor-pointer rounded-lg",
                                      isAnulado
                                        ? "text-emerald-700 focus:text-emerald-800 focus:bg-emerald-50"
                                        : "text-red-600 focus:text-red-700 focus:bg-red-50",
                                    )}
                                  >
                                    {isAnulado ? (
                                      <>
                                        <RotateCcw className="h-4 w-4" />
                                        Desanular
                                      </>
                                    ) : (
                                      <>
                                        <Ban className="h-4 w-4" />
                                        Anular
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>

                          {/* Expanded movimientos sub-table */}
                          {isExpanded && (
                            <tr
                              key={`${cierre.id}-movimientos`}
                              className="bg-gray-50/80"
                            >
                              <td colSpan={9} className="px-8 py-4">
                                {movimientos.length === 0 ? (
                                  <p className="text-gray-400 text-sm italic">
                                    Sin movimientos registrados
                                  </p>
                                ) : (
                                  <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="bg-gray-100 text-left text-xs uppercase text-gray-500 tracking-wider">
                                          <th className="px-4 py-2.5">
                                            Fecha y Hora
                                          </th>
                                          <th className="px-4 py-2.5">
                                            Medio de Pago
                                          </th>
                                          <th className="px-4 py-2.5 text-right">
                                            Monto
                                          </th>
                                          <th className="px-4 py-2.5 text-center">
                                            Estado
                                          </th>
                                          <th className="px-4 py-2.5">
                                            Comentarios
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100">
                                        {movimientos.map((mov) => (
                                          <tr
                                            key={mov.id}
                                            className={cn(
                                              "transition-colors",
                                              mov.anulacionId
                                                ? "opacity-50"
                                                : "hover:bg-white",
                                            )}
                                          >
                                            <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                                              {mov.fechaHora}
                                            </td>
                                            <td className="px-4 py-2.5 font-medium">
                                              {mov.medioPago}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-mono">
                                              {formatCurrency(mov.monto)}
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                              {mov.anulacionId ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-500">
                                                  <Ban className="h-2.5 w-2.5" />
                                                  Anulado
                                                </span>
                                              ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                                  Activo
                                                </span>
                                              )}
                                            </td>
                                            <td className="px-4 py-2.5 text-gray-500">
                                              {mov.comentarios || (
                                                <span className="text-gray-300">
                                                  —
                                                </span>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Anular / Desanular Modal */}
      {anularModal && (
        <AnularModal
          open={anularModal.open}
          onClose={closeAnularModal}
          isAnulado={anularModal.isAnulado}
          cierreId={anularModal.cierreId}
          fechaOperacion={anularModal.fechaOperacion}
          onConfirm={handleAnularDesanular}
        />
      )}
    </div>
  );
}
