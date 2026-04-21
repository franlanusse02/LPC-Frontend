import type { UsuarioResponse } from "../auth/UsuarioResponse";

export type AnulacionMovimientoResponse = {
    id: number;
    anuladoPor: UsuarioResponse;
    fechaAnulacion: string;
    motivoAnulacion: string;
}