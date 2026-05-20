import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "@/components/loading";

type ProtectedRouteProps = {
  allowOnly?: string;
};

export function ProtectedRoute({ allowOnly }: ProtectedRouteProps) {
  const { session, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  if (!session?.rol) {
    return <Navigate to="/login" replace />;
  }

  if (allowOnly && session.rol !== allowOnly) {
    if (session?.rol.toUpperCase() === "ENCARGADO") {
      return <Navigate to="/encargado" replace />;
    } else if (session?.rol.toUpperCase() === "CONTABILIDAD") {
      return <Navigate to="/contabilidad" replace />;
    }
  }

  return <Outlet />;
}
