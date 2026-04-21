import type { EstadoFactura } from "@/domain/enums/EstadoFactura";
import type { MedioPago } from "@/domain/enums/MedioPago";

export type FacturaProveedorResponse = {
    id: number;
    numero: string;
    proveedorId: number;
    comedorId: number;
    puntoDeVenta: number | null;
    fechaFactura: string;
    fechaEmision: string | null;
    fechaPago: string | null;
    monto: number;
    comentarios: string | null;
    numeroOperacion: string | null;
    medioPago: MedioPago | null;
    bancoId: number | null;
    bancoNombre: string | null;
    bancoSociedadId: number | null;
    creadoPorId: number;
    estado: EstadoFactura;
    creadoEn: string;
    anulacionId: number | null;
  };
