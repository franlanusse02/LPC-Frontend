import { EstadoFactura } from "@/models/enums/EstadoFactura";
import { MedioPago } from "@/models/enums/MedioPago";

export type FacturaProveedorResponse = {
    id: number;
    numero: string;
    proveedorId: number;
    comedorId: number;
    puntoDeVentaProveedor: number | null;
    puntoDeVentaComedor: Record<string, number>;
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
