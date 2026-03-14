"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/header";
import { FormField } from "@/components/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { login, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export function LoginForm() {
  const router = useRouter();
  const { login: loginSession } = useAuth();

  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const normalizedUsuario = usuario.replace(/\D/g, "");
      const cuil = Number(normalizedUsuario);

      if (!Number.isFinite(cuil) || cuil === 0) {
        throw new Error("Ingresa un CUIL válido");
      }

      const auth = await login(cuil, password);

      loginSession({
        token: auth.token,
        usuario,
      });

      router.replace("/");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error al iniciar sesión");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardContent className="p-10">
          <div className="mb-10 flex justify-center">
            <Brand large />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField label="CUIL">
              <Input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                autoComplete="username"
                placeholder="XX-XXXXXXXX-X"
                className="bg-muted"
              />
            </FormField>

            <FormField label="Contraseña">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="bg-muted"
              />
            </FormField>

            <Button
              type="submit"
              disabled={loading}
              className="w-full text-sm font-bold uppercase tracking-wide"
              size="lg"
            >
              {loading ? (
                <>
                  <Spinner className="mr-2" />
                  Ingresando...
                </>
              ) : (
                "Ingresar"
              )}
            </Button>

            {error && (
              <p className="text-center text-sm text-destructive">{error}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
