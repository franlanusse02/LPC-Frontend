export type CreateOrdenDeCompraItemRequest = {
  proveedorItemId: number;
  cantidad: number;
};

export type CreateOrdenDeCompraRequest = {
  fecha: string;
  fechaEstimadaEntrega?: string | null;
  solicitante: string;
  sociedadId: number;
  comedorId: number;
  proveedorId: number;
  plazoEntrega?: string | null;
  condicionEntrega?: string | null;
  tipoFactura?: string | null;
  descuento?: number | null;
  observaciones?: string | null;
  items: CreateOrdenDeCompraItemRequest[];
};
