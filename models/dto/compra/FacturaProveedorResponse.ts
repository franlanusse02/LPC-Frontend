import { EstadoFactura } from "@/models/enums/EstadoFactura";
import { MedioPago } from "@/models/enums/MedioPago";
import { FacturaPuntoDeVentaMonto } from "@/models/dto/compra/FacturaPuntoDeVentaMonto";

export type FacturaProveedorResponse = {
    id: number;
    numero: string;
    proveedorId: number;
    comedorId: number;
    puntoDeVentaProveedor: number | null;
    puntoDeVentaComedor: FacturaPuntoDeVentaMonto[];
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
    creadoPorNombre: string;
    estado: EstadoFactura;
    creadoEn: string;
    anulacionId: number | null;
  };
