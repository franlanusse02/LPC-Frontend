import { useCallback } from "react";
import { fetchWithAuth } from "@/lib/api-client";

export const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export function useApi() {
  const get = useCallback(
    (path: string, options?: RequestInit) =>
      fetchWithAuth(path, { baseUrl: BASE_URL, ...options }),
    [],
  );

  const post = useCallback(
    (path: string, body: unknown, options?: RequestInit) =>
      fetchWithAuth(path, {
        baseUrl: BASE_URL,
        method: "POST",
        body: JSON.stringify(body),
        ...options,
      }),
    [],
  );

  const put = useCallback(
    (path: string, body: unknown, options?: RequestInit) =>
      fetchWithAuth(path, {
        baseUrl: BASE_URL,
        method: "PUT",
        body: JSON.stringify(body),
        ...options,
      }),
    [],
  );

  const patch = useCallback(
    (path: string, body: unknown, options?: RequestInit) =>
      fetchWithAuth(path, {
        baseUrl: BASE_URL,
        method: "PATCH",
        body: JSON.stringify(body),
        ...options,
      }),
    [],
  );

  const del = useCallback(
    (path: string, options?: RequestInit) =>
      fetchWithAuth(path, { baseUrl: BASE_URL, method: "DELETE", ...options }),
    [],
  );

  return { get, post, put, patch, del };
}
