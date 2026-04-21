import { isTokenExpired, STORAGE_KEY } from "./auth-utils";
import type { Session } from "./auth-types";

type FetchOptions = RequestInit & {
  /** Base URL prefix, e.g. "https://api.example.com" */
  baseUrl?: string;
};

function getSession(): Session | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Session) : null;
  } catch {
    return null;
  }
}

function expireAndRedirect() {
  sessionStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("auth:expired"));
}

export async function fetchWithAuth(
  path: string,
  { baseUrl = "", ...options }: FetchOptions = {},
): Promise<Response> {
  const session = getSession();

  // Bail early if there's no token or it's already expired
  if (!session || isTokenExpired(session.token)) {
    expireAndRedirect();
    // Return a synthetic 401 so callers can handle it uniformly
    return new Response(null, { status: 401, statusText: "Unauthorized" });
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      Authorization: `Bearer ${session.token}`,
    },
  });

  if (response.status === 401) {
    expireAndRedirect();
  }

  return response;
}
