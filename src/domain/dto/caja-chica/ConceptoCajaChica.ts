export type ConceptoCajaChicaResponse = {
  id: number;
  nombre: string;
  // e.g. "Otros": a movimiento with this concepto must carry a detalle.
  requiereDetalle: boolean;
  activo: boolean;
};

export type CreateConceptoCajaChicaRequest = {
  nombre: string;
  requiereDetalle: boolean;
};

export type PatchConceptoCajaChicaRequest = {
  nombre?: string;
  requiereDetalle?: boolean;
  activo?: boolean;
};
