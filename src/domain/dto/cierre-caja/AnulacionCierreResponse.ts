import { UsuarioResponse } from "../auth/UsuarioResponse";

export type AnulacionCierreResponse ={
    id: number;
    anuladoPor: UsuarioResponse;
    fechaAnulacion: string;
    motivoAnulacion: string;
}