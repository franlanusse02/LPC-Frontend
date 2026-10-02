// 201 = created, 200 = a deleted legajo with that cuil was reactivated.
export type LegajoRequest = {
  taxId: number;
  nombre: string;
  comedorId?: number | null;
};
