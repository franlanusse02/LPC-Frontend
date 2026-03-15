"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const router = useRouter();
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!session) {
        router.replace("/login");
      }
      if (session?.rol === "ENCARGADO") {
        router.replace("/cierres");
      } else if (session?.rol === "CONTABILIDAD") {
        router.replace("/contabilidad");
      }
    }
  }, [session, isLoading, router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-3xl px-6 py-10">
        {/* Cierres Section */}
        <section>
          <Card className="border-0 shadow-md rounded-xl">
            <CardHeader className="flex items-center justify-between border-b px-6 py-4">
              <CardTitle className="text-xl font-bold text-gray-800">
                Menu Administrador
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Tu puedes elegir como ver el sistema
              </CardDescription>
            </CardHeader>

            <CardContent className="overflow-x-auto">
              <Button
                onClick={() => router.push("/contabilidad")}
                className="w-full my-2"
              >
                Panel Contabilidad
              </Button>
              <Button
                onClick={() => router.push("/cierres")}
                className="w-full my-2"
              >
                Panel Cierres
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
