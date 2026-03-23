export type CreateFacturaProveedorRequest = {
  numero: string;
  proveedorId: number;
  comedorId: number;
  fechaFactura: string;
  monto: number;
  comentarios: string;
  puntoDeVenta: number;
};
