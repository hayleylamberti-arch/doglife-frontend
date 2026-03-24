import { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/api";

type User = {
  id: string;
  role: "OWNER" | "SUPPLIER";
};

type AuthContextType = {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  setToken: (token: string | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* Load token + fetch user */
  useEffect(() => {
    const stored = localStorage.getItem("token");

    if (!stored) {
      setIsLoading(false);
      return;
    }

    setTokenState(stored);

    const fetchUser = async () => {
      try {
        const res = await api.get("/api/auth/me");
        setUser(res.data);
      } catch {
        localStorage.removeItem("token");
        setTokenState(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const setToken = (token: string | null) => {
  if (token) {
    localStorage.setItem("token", token);
    setTokenState(token);
  } else {
    localStorage.removeItem("token");
    setTokenState(null);
    setUser(null);
  }
};

  const logout = () => {
    localStorage.removeItem("token");
    setTokenState(null);
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{ token, user, isLoading, setToken, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* Hook */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}