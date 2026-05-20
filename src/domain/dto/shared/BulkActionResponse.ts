export type BulkActionResponse = {
  total: number;
  exitosas: number;
  fallidas: number;
  errores: { id: number; mensaje: string }[];
};
