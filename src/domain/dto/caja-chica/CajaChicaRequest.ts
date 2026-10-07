// Exactly one of comedorId / titularUsuarioId.
export type CreateCajaChicaRequest = {
  nombre: string;
  comedorId: number | null;
  titularUsuarioId: number | null;
  accesoUsuarioIds: number[];
};

export type PatchCajaChicaRequest = {
  nombre?: string;
  activa?: boolean;
};

// Full replace; [] revokes every grant.
export type SetAccesosRequest = {
  usuarioIds: number[];
};
