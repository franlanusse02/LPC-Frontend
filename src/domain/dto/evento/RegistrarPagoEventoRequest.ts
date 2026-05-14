import type { MedioPago } from "@/domain/enums/MedioPago";

export type RegistrarPagoEventoRequest = {
  fechaPago: string;
  medioPago: MedioPago;
  numeroOperacion: string;
