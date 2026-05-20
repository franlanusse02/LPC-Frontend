import { createContext } from "react";
import type { Session } from "./auth-types";

export interface AuthContextValue {
  session: Session | null;
  token: string | null;
  isLoading: boolean;
  login: (session: Session) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
