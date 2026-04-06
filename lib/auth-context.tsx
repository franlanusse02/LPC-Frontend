"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

// ── Types ────────────────────────────────────────────────────────────────────
export interface Session {
  token: string;
  nombre: string;
  rol: string;
  cuil?: string | null;
}

interface AuthContextValue {
  session: Session | null;
  token: string | null;
  isLoading: boolean;
  login: (session: Session) => void;
  logout: () => void;
}

// ── JWT helpers ──────────────────────────────────────────────────────────────
function decodeJwtExp(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const { exp } = JSON.parse(json) as { exp?: number };
    return typeof exp === "number" ? exp : null;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const exp = decodeJwtExp(token);
  if (exp === null) return true; // unparseable → treat as expired
  return Date.now() >= exp * 1000;
}

// ── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "lpc_session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearExpiryTimer = () => {
    if (expiryTimer.current) {
      clearTimeout(expiryTimer.current);
      expiryTimer.current = null;
    }
  };

  const expireSession = useCallback(() => {
    clearExpiryTimer();
    setSession(null);
    sessionStorage.removeItem(STORAGE_KEY);
    router.replace("/login?reason=session-expired");
  }, [router]);

  // Schedule auto-logout when the JWT reaches its `exp` claim
  const scheduleExpiry = useCallback(
    (token: string) => {
      clearExpiryTimer();
      const exp = decodeJwtExp(token);
      if (exp === null) return;
      const ms = exp * 1000 - Date.now();
      if (ms <= 0) {
        expireSession();
        return;
      }
      expiryTimer.current = setTimeout(expireSession, ms);
    },
    [expireSession],
  );

  // Hydrate session from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Session;
        if (isTokenExpired(parsed.token)) {
          sessionStorage.removeItem(STORAGE_KEY);
          router.replace("/login?reason=session-expired");
        } else {
          setSession(parsed);
          scheduleExpiry(parsed.token);
        }
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for 401 responses on authenticated requests (fired by apiFetch)
  useEffect(() => {
    const onUnauthorized = () => expireSession();
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, [expireSession]);

  // Clean up timer on unmount
  useEffect(() => () => clearExpiryTimer(), []);

  const login = (newSession: Session) => {
    setSession(newSession);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    scheduleExpiry(newSession.token);
  };

  const logout = () => {
    clearExpiryTimer();
    setSession(null);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        token: session?.token ?? null,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
