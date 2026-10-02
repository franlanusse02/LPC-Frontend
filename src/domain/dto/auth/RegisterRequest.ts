// The account hangs off an existing legajo (by id or by its cuil).
// 201 = created, 200 = the legajo's deleted account was reactivated.
export type RegisterRequest = {
  legajoId?: number;
  cuil?: number;
  rol: string;
  password: string;
};
