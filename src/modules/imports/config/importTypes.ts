export type ImportTypeConfig = {
  key: string;
  endpoint: string;
  label: string;
  columns: { key: string; label: string }[];
};

export const IMPORT_TYPES: ImportTypeConfig[] = [
  {
    key: "empleados-comedor",
    endpoint: "/import/empleados-comedor",
    label: "Empleados",
    columns: [
      { key: "nombre", label: "Nombre" },
      { key: "email", label: "Email" },
      { key: "taxId", label: "CUIT/CUIL" },
      { key: "centroCosto", label: "Centro Costo" },
      { key: "partida", label: "Partida" },
    ],
  },
  {
    key: "proveedores",
    endpoint: "/import/proveedores",
    label: "Proveedores",
    columns: [
      { key: "nombre", label: "Nombre" },
      { key: "taxId", label: "CUIT" },
      { key: "formaDePagoPredeterminada", label: "Forma de Pago" },
      { key: "puntosDeVenta", label: "Puntos de Venta" },
    ],
  },
  {
    key: "facturas",
    endpoint: "/import/facturas",
    label: "Facturas",
    columns: [
      { key: "numeroFactura", label: "N° Factura" },
      { key: "monto", label: "Monto" },
      { key: "fechaFactura", label: "Fecha Factura" },
      { key: "medioPago", label: "Medio Pago" },
      { key: "proveedorNombre", label: "Proveedor" },
      { key: "comedorNombre", label: "Comedor" },
    ],
  },
  {
    key: "consumidores",
    endpoint: "/import/consumidores",
    label: "Consumidores",
    columns: [
      { key: "nombre", label: "Nombre" },
      { key: "taxId", label: "CUIT/CUIL" },
      { key: "posicion", label: "Posición" },
      { key: "comedorNombre", label: "Comedor" },
    ],
  },
  {
    key: "productos",
    endpoint: "/import/productos",
    label: "Productos",
    columns: [
      { key: "comedorNombre", label: "Comedor" },
      { key: "nombre", label: "Nombre" },
      { key: "precio", label: "Precio" },
      { key: "sapId", label: "SAP ID" },
      { key: "activo", label: "Activo" },
    ],
  },
  {
    key: "razones-sociales",
    endpoint: "/import/razones-sociales",
    label: "Razones Sociales",
    columns: [
      { key: "comedorNombre", label: "Comedor" },
      { key: "nombre", label: "Nombre" },
      { key: "taxId", label: "CUIT" },
    ],
  },
  {
    key: "centros-costo-partidas",
    endpoint: "/import/centros-costo-partidas",
    label: "Centros de Costo y Partidas",
    columns: [
      { key: "ccComedorNombre", label: "Comedor (CC)" },
      { key: "ccNombre", label: "Centro de Costo" },
      { key: "partidaComedorNombre", label: "Comedor (Partida)" },
      { key: "partidaNombre", label: "Partida" },
    ],
  },
];

export function getImportType(key: string): ImportTypeConfig | undefined {
  return IMPORT_TYPES.find((t) => t.key === key);
}
