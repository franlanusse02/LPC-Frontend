import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "@/components/loading";
import { homeFor } from "@/modules/identity/homeFor";

type ProtectedRouteProps = {
  allowOnly?: string;
};

// Logged-in pages. With allowOnly, only that role; any other goes to its own home. A role this
// frontend doesn't know is sent to log in again (LPC-234).
export function ProtectedRoute({ allowOnly }: ProtectedRouteProps) {
  const { session, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  const home = homeFor(session?.rol);
  if (!home) {
    return <Navigate to="/login" replace />;
  }
  if (allowOnly && session!.rol.toUpperCase() !== allowOnly) {
    return <Navigate to={home} replace />;
  }

  return <Outlet />;
}
