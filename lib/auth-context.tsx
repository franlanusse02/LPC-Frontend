"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

// ── Types ────────────────────────────────────────────────────────────────────
export interface Session {
  token: string;
  nombre: string;
  rol: string;
}

interface AuthContextValue {
  session: Session | null;
  token: string | null;
  isLoading: boolean;
  login: (session: Session) => void;
  logout: () => void;
}

// ── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "lpc_session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate session from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Session;
        setSession(parsed);
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (newSession: Session) => {
    setSession(newSession);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
  };

  const logout = () => {
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
