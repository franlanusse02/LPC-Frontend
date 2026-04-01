import { ApiError, ApiErrorResponse } from "@/models/dto/ApiError";

function getApiUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:8080";
  }

  throw new Error("NEXT_PUBLIC_API_URL no esta configurada para este deploy.");
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const apiUrl = getApiUrl();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  } as Record<string, string>;

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const response = await fetch(`${apiUrl}${path}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    try {
      const errorBody = await response.json();
      if (errorBody && typeof errorBody.message === "string") {
        throw new ApiError(errorBody as ApiErrorResponse);
      }
    } catch (parseError) {
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
