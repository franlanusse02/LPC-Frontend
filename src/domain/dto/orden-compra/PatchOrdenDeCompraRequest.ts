import type { CreateOrdenDeCompraItemRequest } from "@/domain/dto/orden-compra/CreateOrdenDeCompraRequest";

export type PatchOrdenDeCompraRequest = {
  fecha?: string;
  fechaEstimadaEntrega?: string | null;
  fechaRecepcion?: string | null;
  solicitante?: string;
  sociedadId?: number;
  comedorId?: number;
  proveedorId?: number;
  plazoEntrega?: string | null;
  condicionEntrega?: string | null;
  tipoFactura?: string | null;
  descuento?: number | null;
  observaciones?: string | null;
  items?: CreateOrdenDeCompraItemRequest[];
};
