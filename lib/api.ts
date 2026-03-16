import { ApiError, ApiErrorResponse } from "@/models/dto/ApiError";

const API_URL = "http://localhost:8080";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  } as Record<string, string>;

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const response = await fetch(`${API_URL}${path}`, {
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
