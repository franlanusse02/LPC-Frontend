import type { UserRole } from "@/domain/enums/UserRole";

// Each role's landing page (LPC-234). Guards send a user here when a page isn't theirs.
const HOME: Record<UserRole, string> = {
  ADMIN: "/",
  ENCARGADO: "/encargado",
  CONTABILIDAD: "/contabilidad",
  CARGA_DATOS: "/carga-datos",
  RRHH: "/rrhh",
};

// Null for a role this frontend doesn't know: the session can't be trusted, so log in again.
export function homeFor(rol: string | undefined): string | null {
  const key = rol?.toUpperCase() as UserRole | undefined;
  return key && key in HOME ? HOME[key] : null;
}
