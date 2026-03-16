"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface HeaderProps {
  showBack?: boolean;
}

export function Header({ showBack }: HeaderProps) {
  const { logout, session } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <header className="w-full border-b border-border bg-card">
      <div className="flex w-full items-center justify-between px-6 py-4">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-8 w-8 hover:bg-accent/10 focus:ring-2 focus:ring-accent focus:ring-offset-2 transition"
              aria-label="Volver"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}

          <Link href="/" className="flex items-center">
            <Brand name={session?.nombre} />
          </Link>
        </div>

        {/* Right Section */}
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide hover:bg-destructive/10 focus:ring-2 focus:ring-destructive focus:ring-offset-2 transition"
          aria-label="Cerrar sesión"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Salir</span>
        </Button>
      </div>
    </header>
  );
}

export function Brand({
  name = "Usuario",
  greet = true,
}: {
  name?: string;
  greet?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
      <span className="font-bold tracking-tight text-3xl">P_COMEDORES</span>
      <p className="text-sm sm:text-lg text-muted-foreground">
        {greet && <>Bienvenido, {name}</>}
      </p>
    </div>
  );
}
