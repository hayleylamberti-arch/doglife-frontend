import { createContext, useContext, useEffect, useState } from "react";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";

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
   Types
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

interface AuthResponse {
  token: string;
  user: User;
}

/* ===============================
   Context
================================ */

type AuthContextType = {
  user: User | null;
  role: "OWNER" | "SUPPLIER" | "ADMIN" | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  loginMutation: UseMutationResult<AuthResponse, AxiosError, LoginCredentials>;
  registerMutation: UseMutationResult<AuthResponse, AxiosError, RegisterData>;

  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

/* ===============================
   Provider
================================ */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

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

    onSuccess: async (data) => {
      console.log("LOGIN SUCCESS:", data);

      localStorage.setItem("authToken", data.token);
      api.defaults.headers.common.Authorization = `Bearer ${data.token}`;

      setUser(data.user);

      if (data.user.role === "SUPPLIER") {
        try {
          const res = await api.get("/api/supplier/profile");

          console.log("SUPPLIER PROFILE:", res.data);

          if (res.data?.supplier) {
            navigate("/supplier-dashboard");
          } else {
            navigate("/supplier-onboarding");
          }
        } catch (err) {
          console.warn("Supplier profile fetch failed");
          navigate("/supplier-onboarding");
        }
      } else {
        navigate("/dashboard");
      }
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
      api.defaults.headers.common.Authorization = `Bearer ${data.token}`;

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
    delete api.defaults.headers.common.Authorization;
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

    api.defaults.headers.common.Authorization = `Bearer ${token}`;

    api
      .get<User>("/api/auth/me")
      .then((res) => {
        console.log("SESSION RESTORED:", res.data);
        setUser(res.data);
      })
      .catch(() => {
        console.warn("Session restore failed");
        logout();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const isAuthenticated = !!user;
  const role = user?.role ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
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