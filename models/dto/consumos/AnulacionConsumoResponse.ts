import { UsuarioResponse } from "../auth/UsuarioResponse";

export type AnulacionConsumoResponse = {
  id: number;
  anuladoPor: UsuarioResponse;
  fechaAnulacion: string;
  motivoAnulacion: string;
};
