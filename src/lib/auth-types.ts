export interface Session {
  token: string;
  nombre: string;
  rol: string;
  cuil?: string | null;
}
