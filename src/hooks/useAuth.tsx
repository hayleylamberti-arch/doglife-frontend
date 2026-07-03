import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type UserRole = "OWNER" | "SUPPLIER" | "ADMIN";

export interface AuthUser {
  id: string;
  role: UserRole;
  email?: string;
  firstName?: string;
  lastName?: string;
  mobilePhone?: string;
  onboardingCompleted?: boolean;
  onboardingStep?: number;
  emailVerified?: boolean;
  subscriptionType?: "free" | "basic" | "premium" | "enterprise" | "owner_plus";
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "OWNER" | "SUPPLIER";
  mobilePhone: string;
  marketingOptIn?: boolean;
}

interface AuthResponse {
  user: AuthUser;
}

interface AuthContextValue {
  token: string | null;
  role: UserRole | null;
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginCredentials) => Promise<AuthResponse>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  registerMutation: UseMutationResult<AuthResponse, unknown, RegisterData, unknown>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function clearOldBrowserTokens() {
  sessionStorage.removeItem("authToken");
  sessionStorage.removeItem("role");

  localStorage.removeItem("authToken");
  localStorage.removeItem("token");
  localStorage.removeItem("role");
}

function extractUser(data: any): AuthUser | null {
  return data?.user || data?.data?.user || null;
}

function extractAuthResponse(data: any): AuthResponse {
  const user = data?.user || data?.data?.user;

  if (!user?.role) {
    throw new Error("Invalid auth response");
  }

  return { user };
}

function getAuthErrorMessage(error: any) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshMe = useCallback(async (): Promise<AuthUser | null> => {
    try {
      clearOldBrowserTokens();

      const response = await api.get("/api/auth/me");
      const me = extractUser(response.data);

      if (!me?.role) {
        throw new Error("Invalid /api/auth/me response");
      }

      setRole(me.role);
      setUser(me);

      return me;
    } catch {
      clearOldBrowserTokens();
      setRole(null);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refreshMe().finally(() => setIsLoading(false));
  }, [refreshMe]);

  const loginMutation = useMutation({
    mutationFn: async (data: LoginCredentials) => {
      try {
        const response = await api.post("/api/auth/login", data);
        return extractAuthResponse(response.data);
      } catch (error: any) {
        throw new Error(getAuthErrorMessage(error));
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      try {
        const response = await api.post("/api/auth/register", data);
        return extractAuthResponse(response.data);
      } catch (error: any) {
        throw new Error(getAuthErrorMessage(error));
      }
    },
  });

  const login = useCallback(
    async (data: LoginCredentials) => {
      const response = await loginMutation.mutateAsync(data);

      clearOldBrowserTokens();
      setRole(response.user.role);
      setUser(response.user);

      await refreshMe();

      return response;
    },
    [loginMutation, refreshMe]
  );

  const register = useCallback(
    async (data: RegisterData) => {
      const response = await registerMutation.mutateAsync(data);

      clearOldBrowserTokens();
      setRole(response.user.role);
      setUser(response.user);

      await refreshMe();

      return response;
    },
    [registerMutation, refreshMe]
  );

  const logout = useCallback(async () => {
  try {
    await api.post("/api/auth/logout");
  } finally {
    clearOldBrowserTokens();
    setRole(null);
    setUser(null);
    window.location.replace("/auth/login");
  }
}, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      role,
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      registerMutation,
      logout,
      refreshMe,
    }),
    [token, role, user, isLoading, login, register, registerMutation, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}