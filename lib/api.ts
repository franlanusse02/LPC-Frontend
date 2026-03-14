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

  const response = await fetch(path, {
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
  return apiFetch<LoginResponse>("/backend/usuarios/login", {
    method: "POST",
    body: JSON.stringify({ cuil, password }),
  })
}

export function getMe(token: string) {
  return apiFetch<UsuarioMe>("/backend/usuarios/me", {}, token)
}

export function getComedores(token: string) {
  return apiFetch<Comedor[]>("/backend/comedor", {}, token)
}

export function getPuntosDeVenta(token: string) {
  return apiFetch<PuntoDeVenta[]>("/backend/puntodeventa", {}, token)
}

export function createCierre(
  token: string,
  payload: CreateCierreInput
) {
  return apiFetch<void>(
    "/backend/cierre",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  )
}

export function getComedorById(token: string, id: number) {
  return apiFetch<Comedor>(`/backend/comedor/${id}`, {}, token)
}

export function getPuntoDeVentaById(token: string, id: number) {
  return apiFetch<PuntoDeVenta>(`/backend/puntodeventa/${id}`, {}, token)
}
