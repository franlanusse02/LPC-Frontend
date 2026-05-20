export type FieldSpec = {
  visible: boolean;
  required: boolean;
  readonly?: boolean;
  autoFill?: "funcionario" | "solicitante";
};

export type CaseFields = {
  solicitante: FieldSpec;
  emailSolicitante: FieldSpec;
  funcionario: FieldSpec;
  centroCosto: FieldSpec;
  partida: FieldSpec;
  responsable: FieldSpec;
  area: FieldSpec;
};

export type ComedorCaseKey = "DEFAULT" | "GALICIA" | "UDESA";

const hidden: FieldSpec = { visible: false, required: false };
const nn = (
  opts?: Partial<FieldSpec>,
): FieldSpec => ({ visible: true, required: true, ...opts });

export const COMEDOR_CASES: Record<ComedorCaseKey, CaseFields> = {
  DEFAULT: {
    solicitante: hidden,
    emailSolicitante: hidden,
    funcionario: hidden,
    centroCosto: hidden,
    partida: hidden,
    responsable: hidden,
    area: hidden,
  },
  GALICIA: {
    solicitante: nn(),
    emailSolicitante: nn(),
    funcionario: nn(),
    centroCosto: nn({ readonly: true, autoFill: "funcionario" }),
    partida: nn({ readonly: true, autoFill: "funcionario" }),
    responsable: nn(),
    area: hidden,
  },
  UDESA: {
    solicitante: nn(),
    emailSolicitante: hidden,
    funcionario: hidden,
    centroCosto: nn(),
    partida: hidden,
    responsable: hidden,
    area: nn(),
  },
};

export function detectCase(comedorNombre: string | undefined): ComedorCaseKey {
  if (!comedorNombre) return "DEFAULT";
  const upper = comedorNombre.toUpperCase();
  if (upper.includes("GALICIA")) return "GALICIA";
  if (upper.includes("UDESA")) return "UDESA";
  return "DEFAULT";
}

export function getCaseFields(
  comedorNombre: string | undefined,
): CaseFields {
  return COMEDOR_CASES[detectCase(comedorNombre)];
}
