"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

interface HeaderProps {
  showBack?: boolean;
}

export function Header({ showBack }: HeaderProps) {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <header className="w-full border-b border-border bg-card">
      <div className="flex w-full items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-8 w-8"
              aria-label="Volver"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Link href="/">
            <Brand />
          </Link>
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="gap-2 text-xs font-bold uppercase tracking-wide"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Salir</span>
        </Button>
      </div>
    </header>
  );
}

export function Brand({ large = false }: { large?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`font-bold tracking-tight ${large ? "text-4xl" : "text-3xl"}`}
      >
        P_COMEDORES
      </span>
    </div>
  );
}
