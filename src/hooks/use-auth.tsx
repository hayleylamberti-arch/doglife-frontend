// client/src/hooks/use-auth.ts
import { createContext, useContext, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

type AuthContextType = {
  user: any | null;
  loginMutation: any;
  registerMutation: any;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loginMutation: null,
  registerMutation: null,
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await api.post("/api/auth/login", data);
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem("authToken", data.token);
      setUser(data.user);
    },
    onError: (error: any) => {
      console.error("Login failed:", error);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post("/api/auth/register", data);
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem("authToken", data.token);
      setUser(data.user);
    },
    onError: (error: any) => {
      console.error("Registration failed:", error);
    },
  });

  const logout = () => {
    localStorage.removeItem("authToken");
    setUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      api
        .get("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setUser(res.data))
        .catch(() => logout());
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loginMutation, registerMutation, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);