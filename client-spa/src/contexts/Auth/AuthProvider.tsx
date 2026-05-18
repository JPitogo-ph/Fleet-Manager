import { createContext, useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { User, AuthContextValue } from "./auth.types";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get<User>("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => {
        //leave to interceptor
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
