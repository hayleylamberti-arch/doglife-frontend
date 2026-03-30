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
  phone?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  profileImageUrl?: string;
  bio?: string;
  businessName?: string;
  serviceTypes?: string[];
  onboardingCompleted?: boolean;
  onboardingStep?: number;
  userType?: "owner" | "provider" | "admin";
  emailVerified?: boolean;
  isSubscribed?: boolean;
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
}

interface AuthResponse {
  token: string;
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
  logout: () => void;
  refreshMe: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "token";
const ROLE_KEY = "role";

function persistSession(token: string, role: UserRole) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY));
  const [role, setRole] = useState<UserRole | null>(
    (localStorage.getItem(ROLE_KEY) as UserRole | null) ?? null,
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshMe = useCallback(async (): Promise<AuthUser | null> => {
    const currentToken = localStorage.getItem(TOKEN_KEY);

    if (!currentToken) {
      setUser(null);
      setRole(null);
      setToken(null);
      return null;
    }

    try {
      const response = await api.get<AuthUser>("/api/me");
      setUser(response.data);
      setRole(response.data.role);
      localStorage.setItem(ROLE_KEY, response.data.role);
      setToken(currentToken);
      return response.data;
    } catch {
      clearSession();
      setToken(null);
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
      const response = await api.post<AuthResponse>("/auth/login", data);
      return response.data;
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await api.post<AuthResponse>("/auth/register", data);
      return response.data;
    },
  });

  const login = useCallback(
    async (data: LoginCredentials) => {
      const response = await loginMutation.mutateAsync(data);
      persistSession(response.token, response.user.role);
      setToken(response.token);
      setRole(response.user.role);
      setUser(response.user);
      return response;
    },
    [loginMutation],
  );

  const register = useCallback(
    async (data: RegisterData) => {
      const response = await registerMutation.mutateAsync(data);
      persistSession(response.token, response.user.role);
      setToken(response.token);
      setRole(response.user.role);
      setUser(response.user);
      return response;
    },
    [registerMutation],
  );

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setRole(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      role,
      user,
      isLoading,
      isAuthenticated: Boolean(token),
      login,
      register,
      registerMutation,
      logout,
      refreshMe,
    }),
    [isLoading, login, logout, refreshMe, register, registerMutation, role, token, user],
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
