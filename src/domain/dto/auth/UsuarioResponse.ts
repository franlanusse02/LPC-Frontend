import { UserRole } from "@/models/enums/UserRole";

export type UsuarioResponse = {
  cuil: string;
  rol: UserRole;
  nombre: string;
};

