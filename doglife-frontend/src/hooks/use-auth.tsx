import { createContext, useContext, useEffect, useState } from "react";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AxiosError } from "axios";

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  userType: 'owner' | 'provider' | 'admin';
  profileImageUrl?: string;
  phone?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  bio?: string;
  businessName?: string;
  serviceTypes?: string[];
  latitude?: number;
  longitude?: number;
  emailVerified?: boolean;
  isSubscribed?: boolean;
  subscriptionType?: 'free' | 'basic' | 'premium' | 'enterprise' | 'owner_plus';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: 'owner' | 'provider';
  phone?: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginMutation: UseMutationResult<AuthResponse, AxiosError, LoginCredentials>;
  registerMutation: UseMutationResult<AuthResponse, AxiosError, RegisterData>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loginMutation = useMutation<AuthResponse, AxiosError, LoginCredentials>({
    mutationFn: async (data) => {
      const response = await api.post("/api/auth/login", data);
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem("authToken", data.token);
      setUser(data.user);
    },
    onError: (error) => {
      console.error("Login failed:", error.message);
    },
  });

  const registerMutation = useMutation<AuthResponse, AxiosError, RegisterData>({
    mutationFn: async (data) => {
      const response = await api.post("/api/auth/register", data);
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem("authToken", data.token);
      setUser(data.user);
    },
    onError: (error) => {
      console.error("Registration failed:", error.message);
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
        .get<User>("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setUser(res.data))
        .catch(() => logout())
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, loginMutation, registerMutation, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
