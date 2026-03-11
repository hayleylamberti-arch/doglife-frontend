import { createContext, useContext, useEffect, useState } from "react";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AxiosError } from "axios";

/* ===============================
   User Model
================================ */

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;

  role?: "OWNER" | "SUPPLIER" | "ADMIN";
  onboardingCompleted?: boolean;
  onboardingStep?: number;

  userType?: "owner" | "provider" | "admin";

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
  subscriptionType?: "free" | "basic" | "premium" | "enterprise" | "owner_plus";
}

/* ===============================
   Auth Request Types
================================ */

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  mobilePhone?: string;
  role: "OWNER" | "SUPPLIER";
}

/* ===============================
   API Response
================================ */

interface AuthResponse {
  token: string;
  user: User;
}

/* ===============================
   Context Type
================================ */

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  loginMutation: UseMutationResult<
    AuthResponse,
    AxiosError,
    LoginCredentials
  >;

  registerMutation: UseMutationResult<
    AuthResponse,
    AxiosError,
    RegisterData
  >;

  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

/* ===============================
   Provider
================================ */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* ===============================
     LOGIN
  ================================= */

  const loginMutation = useMutation<AuthResponse, AxiosError, LoginCredentials>({
    mutationFn: async (data) => {
      const response = await api.post("/api/auth/login", data);

      return {
        token: response.data.token,
        user: response.data.user,
      };
    },

    onSuccess: (data) => {
      console.log("LOGIN SUCCESS:", data);

      localStorage.setItem("authToken", data.token);

      setUser(data.user);
    },

    onError: (error) => {
      const message =
        (error.response?.data as any)?.message ||
        "Login failed. Please check your email and password.";

      console.error("LOGIN FAILED:", message);
      alert(message);
    },
  });

  /* ===============================
     REGISTER
  ================================= */

  const registerMutation = useMutation<AuthResponse, AxiosError, RegisterData>({
    mutationFn: async (data) => {
      const response = await api.post("/api/auth/register", data);

      return {
        token: response.data.token,
        user: response.data.user,
      };
    },

    onSuccess: (data) => {
      console.log("REGISTER SUCCESS:", data);

      localStorage.setItem("authToken", data.token);

      setUser(data.user);
    },

    onError: (error) => {
      const message =
        (error.response?.data as any)?.message ||
        "Registration failed. Please try again.";

      console.error("REGISTER FAILED:", message);
      alert(message);
    },
  });

  /* ===============================
     LOGOUT
  ================================= */

  const logout = () => {
    localStorage.removeItem("authToken");
    setUser(null);
  };

  /* ===============================
     SESSION RESTORE
  ================================= */

  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      setIsLoading(false);
      return;
    }

    api
      .get<User>("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        console.log("SESSION RESTORED:", res.data);
        setUser(res.data);
      })
      .catch((err) => {
        console.warn("Session restore failed");
        logout();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        loginMutation,
        registerMutation,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ===============================
   Hook
================================ */

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};