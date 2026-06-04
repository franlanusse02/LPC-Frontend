import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "@/components/loading";

export function AdminRoute() {
  const { isLoading, session } = useAuth();

  if (isLoading) return <LoadingScreen />;

  if (!session?.rol) {
    return <Navigate to="/login" replace />;
  } else if (session?.rol.toUpperCase() === "ENCARGADO") {
    return <Navigate to="/encargado" replace />;
  } else if (session?.rol.toUpperCase() === "CONTABILIDAD") {
    return <Navigate to="/contabilidad" replace />;
  } else if (session?.rol.toUpperCase() === "CARGA_DATOS") {
    return <Navigate to="/carga-datos" replace />;
  }

  return <Outlet />;
}
