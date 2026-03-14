import { NextRequest } from "next/server"

const API_URL = "http://10.0.0.50"
const TARGETS = [API_URL, `${API_URL}:8080`]

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type RouteContext = {
  params: Promise<{
    path: string[]
  }>
}

async function proxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params
  const pathname = path.join("/")
  const search = request.nextUrl.search
  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer()

  let lastError: unknown = null

  for (const target of TARGETS) {
    try {
      const response = await fetch(`${target}/api/${pathname}${search}`, {
        method: request.method,
        headers: buildHeaders(request),
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      })

      return new Response(response.body, {
        status: response.status,
        headers: buildResponseHeaders(response),
      })
    } catch (error) {
      lastError = error
    }
  }

  const message =
    lastError instanceof Error
      ? lastError.message
      : "No se pudo conectar con el backend"

  return Response.json(
    { message: `No se pudo conectar con el backend (${message})` },
    { status: 502 }
  )
}

function buildHeaders(request: NextRequest) {
  const headers = new Headers()
  const authorization = request.headers.get("authorization")
  const contentType = request.headers.get("content-type")

  if (authorization) {
    headers.set("Authorization", authorization)
  }

  if (contentType) {
    headers.set("Content-Type", contentType)
  }

  return headers
}

function buildResponseHeaders(response: Response) {
  const headers = new Headers()
  const contentType = response.headers.get("content-type")

  if (contentType) {
    headers.set("Content-Type", contentType)
  }

  return headers
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxy(request, context)
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxy(request, context)
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxy(request, context)
}
