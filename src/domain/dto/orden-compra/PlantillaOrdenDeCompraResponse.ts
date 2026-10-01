export type PlantillaOrdenDeCompraItemResponse = {
  proveedorItemId: number;
  nombre: string;
  codigo: string | null;
  cantidad: number;
  activo: boolean;
};

export type PlantillaOrdenDeCompraResponse = {
  id: number;
  nombre: string;
  sociedadId: number | null;
  sociedadNombre: string | null;
  comedorId: number | null;
  comedorName: string | null;
  proveedorId: number;
  proveedorNombre: string;
  solicitante: string | null;
  plazoEntrega: string | null;
  condicionEntrega: string | null;
  tipoFactura: string | null;
  descuento: number | null;
  observaciones: string | null;
  creadoEn: string;
  actualizadoEn: string;
  items: PlantillaOrdenDeCompraItemResponse[];
};
