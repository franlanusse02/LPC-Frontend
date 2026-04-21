import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "@/components/loading";

export function AdminRoute() {
  const { isLoading, session } = useAuth();

  if (isLoading) return <LoadingScreen />;

  if (!session?.rol) {
    return <Navigate to="/login" replace />;
  } else if (session?.rol.toUpperCase() === "ENCARGADO") {
    return <Navigate to="/cierres" replace />;
  } else if (session?.rol.toUpperCase() === "CONTABILIDAD") {
    return <Navigate to="/contabilidad" replace />;
  }

  return <Outlet />;
}
