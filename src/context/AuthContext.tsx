import { createContext, useContext, useState, useEffect } from "react";

type AuthContextType = {
  token: string | null;
  setToken: (token: string | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);

  /* Load token on app start */
  useEffect(() => {
    const stored = localStorage.getItem("token");
    if (stored) setTokenState(stored);
  }, []);

  const setToken = (token: string | null) => {
    if (token) {
      localStorage.setItem("token", token);
      setTokenState(token);
    } else {
      localStorage.removeItem("token");
      setTokenState(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setTokenState(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ token, setToken, logout }}>
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