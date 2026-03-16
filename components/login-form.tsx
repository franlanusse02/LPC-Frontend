"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/header";
import { FormField } from "@/components/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { apiFetch } from "@/lib/api";
import { ApiError } from "@/models/dto/ApiError";
import { useAuth } from "@/lib/auth-context";
import { LoginResponse } from "@/models/dto/auth/LoginResponse";

export function LoginForm() {
  const CUIL_LENGTH = 11;
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

      if (normalizedUsuario.length !== CUIL_LENGTH) {
        throw new Error("El CUIL debe tener 11 dígitos");
      }

      const cuil = Number(normalizedUsuario);

      if (!Number.isFinite(cuil) || cuil === 0) {
        throw new Error("Ingresa un CUIL válido");
      }

      const auth = await apiFetch<LoginResponse>(
        "/api/usuarios/login",
        {
          method: "POST",
          body: JSON.stringify({ cuil, password }),
        },
        undefined,
      );

      loginSession({
        token: auth.token,
        rol: auth.rol,
        name: auth.name,
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
            <Brand greet={false} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField label="CUIL">
              <Input
                type="text"
                value={usuario}
                onChange={(e) =>
                  setUsuario(
                    e.target.value.replace(/\D/g, "").slice(0, CUIL_LENGTH),
                  )
                }
                autoComplete="username"
                inputMode="numeric"
                maxLength={CUIL_LENGTH}
                placeholder="XXXXXXXXXXX"
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
