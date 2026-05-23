import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

import { AuthContext } from "./auth-context";
import { decodeJwtExp, isTokenExpired, STORAGE_KEY } from "./auth-utils";
import type { Session } from "./auth-types";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearExpiryTimer = () => {
    if (expiryTimer.current) clearTimeout(expiryTimer.current);
  };

  const expireSession = useCallback(() => {
    clearExpiryTimer();
    setSession(null);
    sessionStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("auth:expired"));
  }, []);

  const scheduleExpiry = useCallback(
    (token: string) => {
      clearExpiryTimer();
      const exp = decodeJwtExp(token);
      if (!exp) return;

      const ms = exp * 1000 - Date.now();
      if (ms <= 0) return expireSession();

      expiryTimer.current = setTimeout(expireSession, ms);
    },
    [expireSession],
  );

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed = JSON.parse(stored) as Session;

        if (isTokenExpired(parsed.token)) {
          sessionStorage.removeItem(STORAGE_KEY);
        } else {
          setSession(parsed);
          scheduleExpiry(parsed.token);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [scheduleExpiry]);

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
