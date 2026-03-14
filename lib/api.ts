const API_URL = "http://10.0.0.50"

export type LoginResponse = {
  token: string
  cuil: number
  rol: string
}

export type Comedor = {
  id: number
  name: string
}

export type PuntoDeVenta = {
  id: number
  nombre: string
  comedorId: number
}

export type UsuarioMe = {
  cuil: number
  rol: string
}

export type CreateCierreInput = {
  puntoVentaId: number
  fechaOperacion: string
  totalPlatosVendidos: number
  comentarios: string
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers = new Headers(options.headers)

  headers.set("Content-Type", "application/json")

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed: ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export function login(cuil: number, password: string) {
  return apiFetch<LoginResponse>("/api/usuarios/login", {
    method: "POST",
    body: JSON.stringify({ cuil, password }),
  })
}

export function getMe(token: string) {
  return apiFetch<UsuarioMe>("/api/usuarios/me", {}, token)
}

export function getComedores(token: string) {
  return apiFetch<Comedor[]>("/api/comedor", {}, token)
}

export function getPuntosDeVenta(token: string) {
  return apiFetch<PuntoDeVenta[]>("/api/puntodeventa", {}, token)
}

export function createCierre(
  token: string,
  payload: CreateCierreInput
) {
  return apiFetch<void>(
    "/api/cierre",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  )
}

export function getComedorById(token: string, id: number) {
  return apiFetch<Comedor>(`/api/comedor/${id}`, {}, token)
}

export function getPuntoDeVentaById(token: string, id: number) {
  return apiFetch<PuntoDeVenta>(`/api/puntodeventa/${id}`, {}, token)
}
