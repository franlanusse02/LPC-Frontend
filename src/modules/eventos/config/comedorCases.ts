export type FieldSpec = {
  visible: boolean;
  required: boolean;
  readonly?: boolean;
  autoFill?: "funcionario";
  type?: "empleado" | "funcionario" | "centroCosto" | "partida" | "razonSocial" | "text" | "number";
};

export type CaseFields = {
  solicitante: FieldSpec;
  emailSolicitante: FieldSpec;
  funcionario: FieldSpec;
  responsable: FieldSpec;
  centroCosto: FieldSpec;
  partida: FieldSpec;
  precioUnitario: FieldSpec;
  retenciones: FieldSpec;
  numeroOperacion: FieldSpec;
  razonSocial: FieldSpec;
  destinatarioFacturacion: FieldSpec;
  tipoComprobante: FieldSpec;
  numeroComprobante: FieldSpec;
  ordenCompra: FieldSpec;
  legajo: FieldSpec;
  recepcion: FieldSpec;
  numeroPedido: FieldSpec;
  concepto: FieldSpec;
  area: FieldSpec;
  adicionales: FieldSpec;
};

export type ComedorCaseKey = "DEFAULT" | "GALICIA" | "BBVA" | "TECHINT" | "UDESA";

const hidden: FieldSpec = { visible: false, required: false };
const opt = (
  opts?: Partial<FieldSpec>,
): FieldSpec => ({ visible: true, required: false, ...opts });
const req = (
  opts?: Partial<FieldSpec>,
): FieldSpec => ({ visible: true, required: true, ...opts });

const BASE_HIDDEN: CaseFields = {
  solicitante: hidden,
  emailSolicitante: hidden,
  funcionario: hidden,
  responsable: hidden,
  centroCosto: hidden,
  partida: hidden,
  precioUnitario: hidden,
  retenciones: hidden,
  numeroOperacion: hidden,
  razonSocial: hidden,
  destinatarioFacturacion: hidden,
  tipoComprobante: hidden,
  numeroComprobante: hidden,
  ordenCompra: hidden,
  legajo: hidden,
  recepcion: hidden,
  numeroPedido: hidden,
  concepto: hidden,
  area: hidden,
  adicionales: hidden,
};

export const COMEDOR_CASES: Record<ComedorCaseKey, CaseFields> = {
  DEFAULT: { ...BASE_HIDDEN },

  GALICIA: {
    ...BASE_HIDDEN,
    solicitante: req({ type: "empleado" }),
    emailSolicitante: req({ type: "text" }),
    funcionario: req({ type: "empleado" }),
    responsable: req({ type: "empleado" }),
    centroCosto: req({ type: "centroCosto" }),
    partida: req({ type: "partida" }),
    precioUnitario: opt({ type: "number" }),
    retenciones: opt({ type: "number" }),
    numeroOperacion: opt({ type: "text" }),
    razonSocial: req({ type: "razonSocial" }),
    destinatarioFacturacion: opt({ type: "text" }),
    tipoComprobante: opt({ type: "text" }),
    numeroComprobante: opt({ type: "text" }),
  },

  BBVA: {
    ...BASE_HIDDEN,
    solicitante: req({ type: "empleado" }),
    emailSolicitante: req({ type: "text" }),
    ordenCompra: opt({ type: "text" }),
    legajo: req({ type: "centroCosto" }),
    recepcion: req({ type: "partida" }),
  },

  TECHINT: {
    ...BASE_HIDDEN,
    numeroPedido: opt({ type: "text" }),
    razonSocial: req({ type: "razonSocial" }),
    concepto: opt({ type: "text" }),
    tipoComprobante: opt({ type: "text" }),
    numeroComprobante: opt({ type: "text" }),
  },

  UDESA: {
    ...BASE_HIDDEN,
    solicitante: req({ type: "empleado" }),
    centroCosto: req({ type: "centroCosto" }),
    area: req({ type: "partida" }),
    precioUnitario: opt({ type: "number" }),
    adicionales: opt({ type: "number" }),
  },
};

export function detectCase(comedorNombre: string | undefined): ComedorCaseKey {
  if (!comedorNombre) return "DEFAULT";
  const upper = comedorNombre.toUpperCase();
  if (upper.includes("GALICIA")) return "GALICIA";
  if (upper.includes("BBVA")) return "BBVA";
  if (upper.includes("TECHINT")) return "TECHINT";
  if (upper.includes("UDESA")) return "UDESA";
  return "DEFAULT";
}

export function getCaseFields(comedorNombre: string | undefined): CaseFields {
  return COMEDOR_CASES[detectCase(comedorNombre)];
}
