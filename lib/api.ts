// ── Types ────────────────────────────────────────────────────────────────────
export type LoginResponse = {
  token: string;
  cuil: number;
  rol: string;
};

export type Comedor = {
  id: number;
  name: string;
};

export type PuntoDeVenta = {
  id: number;
  nombre: string;
  comedorId: number;
};

export type UsuarioMe = {
  cuil: number;
  rol: string;
};

export type CreateCierreInput = {
  puntoVentaId: number;
  fechaOperacion: string;
  totalPlatosVendidos: number;
  comentarios: string;
};

export type CreateMovimientoInput = {
  cierreCajaId: number;
  medioPago: string;
  monto: number;
};

export type CierreResponse = {
  id: number;
};

// ── Error Response (matches Spring backend ErrorResponse DTO) ────────────────
export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly error: string;
  public readonly path: string;
  public readonly timestamp: string;

  constructor(response: ApiErrorResponse) {
    super(response.message);
    this.name = "ApiError";
    this.status = response.status;
    this.error = response.error;
    this.path = response.path;
    this.timestamp = response.timestamp;
  }

  static isUnauthorized(error: unknown): boolean {
    return error instanceof ApiError && error.status === 401;
  }
}

// ── Fetch Helper ─────────────────────────────────────────────────────────────
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const response = await fetch(`http://localhost:8080${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    // Try to parse as ErrorResponse DTO
    try {
      const errorBody = await response.json();
      if (errorBody && typeof errorBody.message === "string") {
        throw new ApiError(errorBody as ApiErrorResponse);
      }
    } catch (parseError) {
      // If parsing fails, throw generic error
      if (parseError instanceof ApiError) throw parseError;
    }
    throw new ApiError({
      timestamp: new Date().toISOString(),
      status: response.status,
      error: response.statusText,
      message: `Error ${response.status}: ${response.statusText}`,
      path,
    });
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ── API Functions ────────────────────────────────────────────────────────────
export function login(cuil: number, password: string) {
  return apiFetch<LoginResponse>("/api/usuarios/login", {
    method: "POST",
    body: JSON.stringify({ cuil, password }),
  });
}

export function getMe(token: string) {
  return apiFetch<UsuarioMe>("/api/usuarios/me", {}, token);
}

export function getComedores(token: string) {
  return apiFetch<Comedor[]>("/api/comedor", {}, token);
}

export function getPuntosDeVenta(token: string) {
  return apiFetch<PuntoDeVenta[]>("/api/puntodeventa", {}, token);
}

export function createCierre(token: string, payload: CreateCierreInput) {
  return apiFetch<CierreResponse>(
    "/api/cierre",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function createMovimiento(
  token: string,
  payload: CreateMovimientoInput,
) {
  return apiFetch<void>(
    "/api/movimiento",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function getComedorById(token: string, id: number) {
  return apiFetch<Comedor>(`/api/comedor/${id}`, {}, token);
}

export function getPuntoDeVentaById(token: string, id: number) {
  return apiFetch<PuntoDeVenta>(`/api/puntodeventa/${id}`, {}, token);
}
