import { EstadoFactura } from "@/models/enums/EstadoFactura";

export type FacturaProveedorResponse = {
    id: number;
    numero: string;
    proveedorId: number;
    comedorId: number;
    fechaFactura: string;
    monto: number;
    comentarios: string;
    puntoDeVenta: number;
    fechaEmision: string;
    fechaPago: string;
    creadoPorId: number;
    estado: EstadoFactura;
    creadoEn: string;
    anulacionId: number;
  };

