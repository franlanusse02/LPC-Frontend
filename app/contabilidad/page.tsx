"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { DetailedCierreCajaResponse } from "@/models/dto/cierre-caja/CierreCajaResponse";
import { MovimientoResponse } from "@/models/dto/movimiento/MovimientoResponse"; // adjust path
import { ChevronDown, ChevronUp } from "lucide-react";

export default function ContabilidadPage() {
  const router = useRouter();
  const { session, isLoading } = useAuth();
  const [cierres, setCierres] = useState<DetailedCierreCajaResponse[]>([]);
  const [loadingCierres, setLoadingCierres] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

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
          console.log(data);
        })
        .then(() => setLoadingCierres(false));
    }
  }, [session]);

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

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
            <CardHeader className="flex items-center justify-between border-b px-6 py-4">
              <CardTitle className="text-xl font-bold text-gray-800">
                Contabilidad
              </CardTitle>
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
                      <th className="px-6 py-3 w-6" />
                      <th className="px-6 py-3">Fecha</th>
                      <th className="px-6 py-3">Comedor</th>
                      <th className="px-6 py-3">Punto de Venta</th>
                      <th className="px-6 py-3">Total Platos</th>
                      <th className="px-6 py-3">Monto Total</th>
                      <th className="px-6 py-3">Comentarios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cierres.map((cierre) => {
                      const isExpanded = expandedRows.has(cierre.id);
                      const movimientos: MovimientoResponse[] =
                        cierre.movimientos ?? [];

                      return (
                        <Fragment key={cierre.id}>
                          <tr
                            key={cierre.id}
                            onClick={() => toggleRow(cierre.id)}
                            className="border-b hover:bg-gray-50 transition cursor-pointer"
                          >
                            <td className="px-4 py-4 text-gray-400">
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {cierre.fechaOperacion}
                            </td>
                            <td className="px-6 py-4">
                              {cierre.comedor.nombre}
                            </td>
                            <td className="px-6 py-4">
                              {cierre.puntoDeVenta.nombre}
                            </td>
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

                          {isExpanded && (
                            <tr
                              key={`${cierre.id}-movimientos`}
                              className="bg-gray-50"
                            >
                              <td colSpan={7} className="px-8 py-4">
                                {movimientos.length === 0 ? (
                                  <p className="text-gray-400 text-sm italic">
                                    Sin movimientos registrados
                                  </p>
                                ) : (
                                  <table className="w-full text-sm border rounded-lg overflow-hidden">
                                    <thead>
                                      <tr className="bg-gray-200 text-left text-gray-600 uppercase text-xs tracking-wide">
                                        <th className="px-4 py-2">
                                          Fecha y Hora
                                        </th>
                                        <th className="px-4 py-2">
                                          Medio de Pago
                                        </th>
                                        <th className="px-4 py-2">Monto</th>
                                        <th className="px-4 py-2">Anulado</th>
                                        <th className="px-4 py-2">
                                          Comentarios
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {movimientos.map((mov) => (
                                        <tr
                                          key={mov.id}
                                          className={`border-t ${mov.anulacionId ? "opacity-50 line-through" : ""}`}
                                        >
                                          <td className="px-4 py-2">
                                            {mov.fechaHora}
                                          </td>
                                          <td className="px-4 py-2">
                                            {mov.medioPago}
                                          </td>
                                          <td className="px-4 py-2">
                                            {new Intl.NumberFormat("es-CL", {
                                              style: "currency",
                                              currency: "ARS",
                                              minimumFractionDigits: 0,
                                            }).format(mov.monto)}
                                          </td>
                                          <td className="px-4 py-2">
                                            {mov.anulacionId ? (
                                              <span className="text-red-500 font-medium">
                                                Sí
                                              </span>
                                            ) : (
                                              <span className="text-green-600">
                                                No
                                              </span>
                                            )}
                                          </td>
                                          <td className="px-4 py-2">
                                            {mov.comentarios || "-"}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
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
    </div>
  );
}
