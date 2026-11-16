import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "@/components/loading";
import { homeFor } from "@/modules/identity/homeFor";

// Admin pages: only ADMIN. Any other role goes to its own home (LPC-234: an allow-list, so a
// new role never falls through into admin pages).
export function AdminRoute() {
  const { isLoading, session } = useAuth();

  if (isLoading) return <LoadingScreen />;

  const home = homeFor(session?.rol);
  if (!home) {
    return <Navigate to="/login" replace />;
  }
  if (session!.rol.toUpperCase() !== "ADMIN") {
    return <Navigate to={home} replace />;
  }

  return <Outlet />;
}
