import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const { logout, session } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="w-full border-b border-border bg-card">
      <div className="flex w-full items-center justify-between px-6 py-4">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            className="flex items-center"
            onClick={() => navigate("/")}
          >
            <Brand name={session?.nombre} />
          </Button>
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
