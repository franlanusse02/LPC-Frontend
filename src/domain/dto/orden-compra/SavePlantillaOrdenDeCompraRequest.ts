import type { CreateOrdenDeCompraItemRequest } from "./CreateOrdenDeCompraRequest";

// Shared by POST (create) and PUT (full replace).
export type SavePlantillaOrdenDeCompraRequest = {
  nombre: string;
  sociedadId?: number | null;
  comedorId?: number | null;
  proveedorId: number;
  solicitante?: string | null;
  plazoEntrega?: string | null;
  condicionEntrega?: string | null;
  tipoFactura?: string | null;
  descuento?: number | null;
  observaciones?: string | null;
  items: CreateOrdenDeCompraItemRequest[];
};
