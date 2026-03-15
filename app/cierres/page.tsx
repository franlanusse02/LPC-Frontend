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
import { DetailedCierreCajaResponse } from "@/models/dto/cierre-caja/CierreCajaResponse";
import { CierresTable } from "@/components/cierres-table";

export default function CierresPage() {
  const router = useRouter();
  const { session, isLoading } = useAuth();
  const [cierres, setCierres] = useState<DetailedCierreCajaResponse[]>([]);
  const [loadingCierres, setLoadingCierres] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!session) router.replace("/login");
      if (session?.rol === "CONTABILIDAD") router.replace("/contabilidad");
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
        <Card className="border-0 shadow-md rounded-xl">
          <CardHeader className="flex items-center justify-between border-b px-6 py-4">
            <CardTitle className="text-xl font-bold text-gray-800">
              Tus Cierres
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <CierresTable cierres={cierres} loading={loadingCierres} readonly />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
