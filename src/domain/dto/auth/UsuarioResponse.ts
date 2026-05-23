import type { UserRole } from "@/domain/enums/UserRole";

export type UsuarioResponse = {
  cuil: string;
  rol: UserRole;
  nombre: string;
};
