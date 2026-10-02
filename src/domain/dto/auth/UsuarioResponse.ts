import type { UserRole } from "@/domain/enums/UserRole";

// cuil and nombre come from the account's legajo.
export type UsuarioResponse = {
  id: number;
  cuil: number;
  rol: UserRole;
  nombre: string;
};
