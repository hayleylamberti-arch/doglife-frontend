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
  isVerified?: boolean;
  verificationStatus?: string | null;
  emergencyContact?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
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

const TOKEN_KEY = "authToken";
const ROLE_KEY = "role";

function getStoredToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

function getStoredRole() {
  return sessionStorage.getItem(ROLE_KEY) as UserRole | null;
}

function setApiToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

function persistSession(token: string, role: UserRole) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(ROLE_KEY, role);

  // Clean up old localStorage auth values
  localStorage.removeItem("authToken");
  localStorage.removeItem("token");
  localStorage.removeItem("role");

  setApiToken(token);
}

function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(ROLE_KEY);

  // Clean up old localStorage auth values
  localStorage.removeItem("authToken");
  localStorage.removeItem("token");
  localStorage.removeItem("role");

  setApiToken(null);
}

function extractUser(data: any): AuthUser | null {
  return data?.user || data?.data?.user || data || null;
}

function extractAuthResponse(data: any): AuthResponse {
  const token = data?.token || data?.data?.token;
  const user = data?.user || data?.data?.user;

  if (!token || !user?.role) {
    throw new Error("Invalid login response");
  }

  return { token, user };
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
  const storedToken = getStoredToken();

  const [token, setToken] = useState<string | null>(storedToken);
  const [role, setRole] = useState<UserRole | null>(getStoredRole());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshMe = useCallback(async (): Promise<AuthUser | null> => {
    const currentToken = getStoredToken();

    if (!currentToken) {
      clearSession();
      setToken(null);
      setRole(null);
      setUser(null);
      return null;
    }

    try {
      setApiToken(currentToken);

      const response = await api.get("/api/me");
      const me = extractUser(response.data);

      if (!me?.role) {
        throw new Error("Invalid /api/me response");
      }

      persistSession(currentToken, me.role);
      setToken(currentToken);
      setRole(me.role);
      setUser(me);

      return me;
    } catch {
      clearSession();
      setToken(null);
      setRole(null);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    setApiToken(storedToken);
    refreshMe().finally(() => setIsLoading(false));
  }, [refreshMe, storedToken]);

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

      persistSession(response.token, response.user.role);
      setToken(response.token);
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

      persistSession(response.token, response.user.role);
      setToken(response.token);
      setRole(response.user.role);
      setUser(response.user);

      await refreshMe();

      return response;
    },
    [registerMutation, refreshMe]
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
    [
      token,
      role,
      user,
      isLoading,
      login,
      register,
      registerMutation,
      logout,
      refreshMe,
    ]
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